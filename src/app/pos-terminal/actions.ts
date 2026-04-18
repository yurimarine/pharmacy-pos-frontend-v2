'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/get-current-user'
import { revalidatePath } from 'next/cache'
import type { CartItem } from '@/types/cart'
import type { Transaction } from '@/types/transaction'

export async function getPOSInventory(pharmacyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      product_id,
      quantity,
      selling_price,
      low_stock_threshold,
      expiry_date,
      products (
        id,
        name,
        generic_name,
        sku,
        requires_prescription,
        status,
        packaging_units ( name, abbreviation ),
        dispensing_units ( name, abbreviation )
      )
    `)
    .eq('pharmacy_id', pharmacyId)
    .eq('is_active', true)
    .order('products(name)', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map(item => {
    const product = item.products as any
    if (!product || product.status === 'discontinued') return null
    return {
      inventoryId: item.id,
      productId: item.product_id,
      productName: product.name as string,
      productGenericName: (product.generic_name as string | null) ?? null,
      productSku: (product.sku as string | null) ?? null,
      requiresPrescription: (product.requires_prescription as boolean) ?? false,
      packagingLabel: product.packaging_units?.name
        ? (product.packaging_units.name as string)
        : null,
      sellingPrice: item.selling_price,
      quantity: item.quantity,
      lowStockThreshold: item.low_stock_threshold,
      expiryDate: item.expiry_date,
    }
  }).filter(Boolean) as NonNullable<ReturnType<typeof mapInventoryItem>>[]
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
}): Promise<Transaction> {
  const supabase = await createClient()

  // 1. Get current user and verify role
  const currentUser = await getCurrentUser()
  if (!['pharmacist', 'pharmacy_assistant'].includes(currentUser.role)) {
    throw new Error('Unauthorized: Only pharmacists and pharmacy assistants can process transactions.')
  }

  // 2. Validate cart is not empty
  if (data.cartItems.length === 0) {
    throw new Error('Cart is empty.')
  }

  // 3. Validate amount tendered
  const total = data.cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  if (data.amountTendered < total) {
    throw new Error('Insufficient amount tendered.')
  }

  // 4. Stock validation — check ALL items, collect all errors before throwing
  const errors: string[] = []
  const validatedItems: Array<{ cartItem: CartItem; currentQuantity: number }> = []

  for (const cartItem of data.cartItems) {
    const { data: inv } = await supabase
      .from('inventory')
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

  // 5. Generate transaction number
  const { data: txnNumber } = await supabase.rpc('generate_transaction_number')

  // 6. Compute totals
  const subtotal = data.cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const discountAmount = 0
  const totalAmount = subtotal - discountAmount
  const changeAmount = data.amountTendered - totalAmount

  // 7. Insert transaction record
  const { data: transaction, error: txnError } = await supabase
    .from('transactions')
    .insert({
      transaction_number: txnNumber,
      pharmacy_id: data.pharmacyId,
      processed_by: currentUser.id,
      status: 'completed',
      payment_method: 'cash',
      subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      amount_tendered: data.amountTendered,
      change_amount: changeAmount,
      notes: data.notes ?? null,
    })
    .select()
    .single()

  if (txnError) throw new Error(txnError.message)

  // 8. Insert transaction items
  const itemsToInsert = data.cartItems.map(item => ({
    transaction_id: transaction.id,
    product_id: item.productId,
    inventory_id: item.inventoryId,
    product_name: item.productName,
    product_generic_name: item.productGenericName,
    product_sku: item.productSku,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    discount_amount: 0,
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

  // 9. Deduct inventory — do not rollback if this fails (transaction already recorded)
  for (const { cartItem, currentQuantity } of validatedItems) {
    const { error: invError } = await supabase
      .from('inventory')
      .update({
        quantity: currentQuantity - cartItem.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartItem.inventoryId)

    if (invError) {
      console.error(
        `[POS] Failed to deduct inventory for ${cartItem.productName} ` +
        `(inventoryId: ${cartItem.inventoryId}): ${invError.message}. ` +
        `Manual correction required.`
      )
    }
  }

  // 10. Revalidate
  revalidatePath('/pos-terminal')
  revalidatePath('/admin/transactions')
  revalidatePath('/admin/inventory')

  // 11. Return completed transaction
  return transaction as unknown as Transaction
}
