'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/get-current-user'
import { revalidatePath } from 'next/cache'
import type { Transaction, TransactionWithItems } from '@/types/transaction'

export async function getTransactions(options: {
  pharmacyId?: string
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}): Promise<{ data: Transaction[]; count: number }> {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Non-admin users are always scoped to their pharmacy
  const effectivePharmacyId =
    currentUser.role === 'pharmacist' || currentUser.role === 'pharmacy_assistant'
      ? currentUser.pharmacy_id ?? undefined
      : options.pharmacyId

  let query = supabase
    .from('transactions')
    .select(
      `
      *,
      pharmacies ( name ),
      users!transactions_processed_by_fkey ( name, role ),
      voided_by_user:users!transactions_voided_by_fkey ( name ),
      transaction_items ( id )
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (effectivePharmacyId) {
    query = query.eq('pharmacy_id', effectivePharmacyId)
  }
  if (options.search) {
    query = query.ilike('transaction_number', `%${options.search}%`)
  }
  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }
  if (options.dateFrom) {
    query = query.gte('created_at', `${options.dateFrom}T00:00:00`)
  }
  if (options.dateTo) {
    query = query.lte('created_at', `${options.dateTo}T23:59:59`)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return { data: (data ?? []) as unknown as Transaction[], count: count ?? 0 }
}

export async function getTransactionById(id: string): Promise<TransactionWithItems | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select(
      `
      *,
      pharmacies ( name ),
      users!transactions_processed_by_fkey ( name, role ),
      voided_by_user:users!transactions_voided_by_fkey ( name ),
      transaction_items (
        id,
        product_id,
        inventory_id,
        product_name,
        product_generic_name,
        product_sku,
        quantity,
        unit_price,
        discount_amount,
        total_price
      )
    `,
    )
    .eq('id', id)
    .single()

  if (error) return null

  return data as unknown as TransactionWithItems
}

export async function getPharmaciesForTransactionFilter(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('pharmacies')
    .select('id, name')
    .order('name', { ascending: true })
  return data ?? []
}

export async function voidTransaction(data: {
  transactionId: string
  adminEmail: string
  adminPassword: string
  voidReason: string
}): Promise<void> {
  // 1. Verify admin credentials using admin client
  const adminClient = createAdminClient()
  const { data: authData, error: authError } =
    await adminClient.auth.signInWithPassword({
      email: data.adminEmail,
      password: data.adminPassword,
    })

  if (authError || !authData.user) {
    throw new Error('Invalid credentials.')
  }

  // 2. Confirm the authenticated user is an admin
  const supabase = await createClient()
  const { data: adminUser } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_id', authData.user.id)
    .single()

  if (!adminUser || adminUser.role !== 'admin') {
    throw new Error('Unauthorized: Administrator access required.')
  }

  // 3. Fetch transaction + items
  const { data: transaction, error: txnFetchError } = await supabase
    .from('transactions')
    .select(`
      *,
      transaction_items (
        inventory_id,
        quantity
      )
    `)
    .eq('id', data.transactionId)
    .single()

  if (txnFetchError || !transaction) throw new Error('Transaction not found.')
  if (transaction.status === 'voided') throw new Error('Transaction is already voided.')

  // 4. Restore inventory BEFORE marking voided (safer — if this fails, don't void)
  const items = transaction.transaction_items as { inventory_id: string; quantity: number }[]
  for (const item of items) {
    const { data: inv } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('id', item.inventory_id)
      .single()

    if (!inv) {
      throw new Error(`Inventory record not found for item ${item.inventory_id}.`)
    }

    const { error: restoreError } = await supabase
      .from('inventory')
      .update({
        quantity: inv.quantity + item.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.inventory_id)

    if (restoreError) {
      throw new Error(`Failed to restore inventory: ${restoreError.message}`)
    }
  }

  // 5. Mark transaction as voided
  const { error: voidError } = await supabase
    .from('transactions')
    .update({
      status: 'voided',
      voided_by: adminUser.id,
      voided_at: new Date().toISOString(),
      void_reason: data.voidReason,
    })
    .eq('id', data.transactionId)

  if (voidError) throw new Error(voidError.message)

  // 6. Revalidate
  revalidatePath('/admin/transactions')
  revalidatePath('/pos-terminal/transactions')
  revalidatePath('/admin/inventory')
}
