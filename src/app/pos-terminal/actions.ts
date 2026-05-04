'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/get-current-user'
import { revalidatePath } from 'next/cache'
import type { CartItem } from '@/types/cart'
import type { Transaction } from '@/types/transaction'

export async function getPOSInventory(pharmacyId: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('pharmacy_inventory')
    .select(`
      id,
      product_id,
      quantity,
      selling_price,
      low_stock_threshold,
      expiry_date,
      product:products!pharmacy_inventory_product_id_fkey(
        id,
        product_name,
        generic_name,
        sku,
        requires_prescription,
        status,
        packaging_type
      )
    `)
    .eq('pharmacy_id', pharmacyId)
    .gt('quantity', 0)
    .or(`expiry_date.is.null,expiry_date.gt.${today}`)

  if (error) throw new Error(error.message)

  return (data ?? []).map(item => {
    const product = item.product as unknown as {
      id: string
      product_name: string
      generic_name: string | null
      sku: string | null
      requires_prescription: boolean
      status: string
      packaging_type: string
    } | null
    if (!product || product.status !== 'active') return null
    return {
      inventoryId: item.id,
      productId: item.product_id,
      productName: product.product_name,
      productGenericName: product.generic_name ?? null,
      productSku: product.sku ?? null,
      requiresPrescription: product.requires_prescription ?? false,
      packagingLabel: product.packaging_type ?? null,
      sellingPrice: Number(item.selling_price),
      quantity: item.quantity,
      lowStockThreshold: item.low_stock_threshold,
      expiryDate: item.expiry_date,
    }
  })
    .filter(Boolean)
    .sort((a, b) =>
      (a!.productName ?? '').localeCompare(b!.productName ?? '')
    ) as NonNullable<ReturnType<typeof mapInventoryItem>>[]
}

// Helper to infer item shape from mapping function
function mapInventoryItem(item: {
  id: string
  product_id: string
  quantity: number
  selling_price: number
  low_stock_threshold: number
  expiry_date: string | null
}) {
  return {
    inventoryId: item.id,
    productId: item.product_id,
    productName: '',
    productGenericName: null as string | null,
    productSku: null as string | null,
    requiresPrescription: false,
    packagingLabel: null as string | null,
    sellingPrice: item.selling_price,
    quantity: item.quantity,
    lowStockThreshold: item.low_stock_threshold,
    expiryDate: item.expiry_date,
  }
}

export type POSInventoryItemFromServer = ReturnType<typeof mapInventoryItem>

export async function processTransaction(data: {
  cartItems: CartItem[]
  amountTendered: number
  pharmacyId: string
  notes?: string
  subtotal: number
  discount_id: string | null
  discount_amount: number
  reference_id: string | null
  reference_name: string | null
}): Promise<Transaction> {
  const supabase = await createClient()

  // 1. Get current user and verify role
  const currentUser = await getCurrentUser()
  if (!['pharmacist', 'pharmacy_assistant'].includes(currentUser.role)) {
    throw new Error('Unauthorized: Only pharmacists and pharmacy assistants can process transactions.')
  }

  // 2. Validate active till session for this user
  const { data: tillSession, error: tillError } = await supabase
    .from('till_sessions')
    .select('id')
    .eq('pharmacy_id', data.pharmacyId)
    .eq('opened_by', currentUser.id)
    .eq('status', 'open')
    .single()

  if (tillError || !tillSession) {
    throw new Error(
      'No active till session. Open the till before processing sales.'
    )
  }

  // 3. Validate cart is not empty
  if (data.cartItems.length === 0) {
    throw new Error('Cart is empty.')
  }

  // 3b. Server-side floor check for whole-cart fixed discounts
  if (
    data.discount_id !== null &&
    data.discount_amount > data.subtotal
  ) {
    throw new Error(
      'Cart discount exceeds the cart subtotal. ' +
      'Please remove the discount and try again.'
    )
  }

  // 4. Validate amount tendered (post-discount total)
  const itemDiscountTotal = data.cartItems.reduce(
    (sum, item) => sum + (item.discountAmount ?? 0),
    0,
  )
  const totalDue = Math.max(
    0,
    data.subtotal - (data.discount_amount ?? 0) - itemDiscountTotal,
  )
  if (data.amountTendered < totalDue) {
    throw new Error('Insufficient amount tendered.')
  }

  // 5. Stock validation — check ALL items, collect all errors before throwing
  const errors: string[] = []
  const validatedItems: Array<{ cartItem: CartItem; currentQuantity: number }> = []

  for (const cartItem of data.cartItems) {
    const { data: inv } = await supabase
      .from('pharmacy_inventory')
      .select('quantity')
      .eq('id', cartItem.inventoryId)
      .single()

    if (!inv || inv.quantity < cartItem.quantity) {
      errors.push(
        `Insufficient stock for ${cartItem.productName}. ` +
        `Available: ${inv?.quantity ?? 0} units.`
      )
    } else {
      validatedItems.push({ cartItem, currentQuantity: inv.quantity })
    }
  }

  if (errors.length > 0) throw new Error(errors.join('\n'))

  // 6. Generate transaction number
  const { data: txnNumber } = await supabase.rpc('generate_transaction_number')

  // 7. Compute totals
  const totalDiscountValue = (data.discount_amount ?? 0) + itemDiscountTotal
  const totalAmount = Math.max(0, data.subtotal - totalDiscountValue)
  const changeAmount = data.amountTendered - totalAmount

  // 8. Insert transaction record
  const { data: transaction, error: txnError } = await supabase
    .from('transactions')
    .insert({
      transaction_number: txnNumber,
      pharmacy_id: data.pharmacyId,
      processed_by: currentUser.id,
      status: 'completed',
      payment_method: 'cash',
      subtotal: data.subtotal,
      discount_id: data.discount_id ?? null,
      discount_amount: data.discount_amount ?? 0,
      reference_id: data.reference_id ?? null,
      reference_name: data.reference_name ?? null,
      total_amount: totalAmount,
      amount_tendered: data.amountTendered,
      change_amount: changeAmount,
      notes: data.notes ?? null,
      till_session_id: tillSession.id,
    })
    .select()
    .single()

  if (txnError) throw new Error(txnError.message)

  // 9. Insert transaction items
  const itemsToInsert = data.cartItems.map(item => ({
    transaction_id: transaction.id,
    product_id: item.productId,
    inventory_id: item.inventoryId,
    product_name: item.productName,
    product_generic_name: item.productGenericName,
    product_sku: item.productSku,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    discount_id: item.discount?.id ?? null,
    discount_amount: item.discountAmount ?? 0,
    total_price: item.totalPrice,
  }))

  const { error: itemsError } = await supabase
    .from('transaction_items')
    .insert(itemsToInsert)

  if (itemsError) {
    // Rollback: delete the orphaned transaction
    await supabase.from('transactions').delete().eq('id', transaction.id)
    throw new Error(itemsError.message)
  }

  // 10. Deduct inventory — do not rollback if this fails (transaction already recorded)
  const adminSupabase = createAdminClient()
  const logEntries: object[] = []

  for (const { cartItem, currentQuantity } of validatedItems) {
    const newQty = currentQuantity - cartItem.quantity

    const { error: invError } = await supabase
      .from('pharmacy_inventory')
      .update({
        quantity: newQty,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartItem.inventoryId)

    if (invError) {
      console.error(
        `[POS] Failed to deduct inventory for ${cartItem.productName} ` +
        `(inventoryId: ${cartItem.inventoryId}): ${invError.message}. ` +
        `Manual correction required.`
      )
    } else {
      logEntries.push({
        entity_type: 'pharmacy',
        entity_id: cartItem.inventoryId,
        action: 'sold',
        quantity_before: currentQuantity,
        quantity_after: newQty,
        quantity_change: -cartItem.quantity,
        reference_type: 'transaction',
        reference_id: transaction.id,
        performed_by: currentUser.id,
      })
    }
  }

  if (logEntries.length > 0) {
    const { error: logErr } = await adminSupabase
      .from('inventory_logs')
      .insert(logEntries)
    if (logErr) {
      console.error(`[POS] Failed to write inventory_logs for transaction ${transaction.id}: ${logErr.message}`)
    }
  }

  // 11. Revalidate
  revalidatePath('/pos-terminal')
  revalidatePath('/admin/transactions')
  revalidatePath('/admin/inventory')

  // 12. Return completed transaction
  return transaction as unknown as Transaction
}
