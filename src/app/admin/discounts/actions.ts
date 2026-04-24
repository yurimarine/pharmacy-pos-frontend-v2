'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/get-current-user'
import { revalidatePath } from 'next/cache'
import type { Discount, DiscountType, DiscountScope } from '@/types/discount'

export async function getDiscounts(params: {
  search?: string
  scope?: string
  type?: string
  isActive?: string
  page?: number
  pageSize?: number
}): Promise<{ data: Discount[]; count: number }> {
  const currentUser = await getCurrentUser()
  if (currentUser.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.')
  }

  const supabase = await createClient()

  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('discounts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }
  if (params.scope && params.scope !== 'all') {
    query = query.eq('scope', params.scope)
  }
  if (params.type && params.type !== 'all') {
    query = query.eq('type', params.type)
  }
  if (params.isActive && params.isActive !== 'all') {
    query = query.eq('is_active', params.isActive === 'true')
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as Discount[], count: count ?? 0 }
}

export async function createDiscount(input: {
  name: string
  type: DiscountType
  value: number
  scope: DiscountScope
  requires_reference: boolean
}): Promise<void> {
  const currentUser = await getCurrentUser()
  if (currentUser.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.')
  }

  if (!input.name.trim()) {
    throw new Error('Discount name is required.')
  }
  if (input.value <= 0) {
    throw new Error('Discount value must be greater than 0.')
  }
  if (input.type === 'percentage' && input.value > 100) {
    throw new Error('Percentage discount cannot exceed 100%.')
  }

  const supabase = await createClient()
  const { error } = await supabase.from('discounts').insert({
    name: input.name.trim(),
    type: input.type,
    value: input.value,
    scope: input.scope,
    requires_reference: input.requires_reference,
    is_active: true,
  })

  if (error) throw new Error('Failed to create discount.')
  revalidatePath('/admin/discounts')
}

export async function updateDiscount(
  id: string,
  input: {
    name: string
    type: DiscountType
    value: number
    scope: DiscountScope
    requires_reference: boolean
  },
): Promise<void> {
  const currentUser = await getCurrentUser()
  if (currentUser.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.')
  }

  if (!input.name.trim()) {
    throw new Error('Discount name is required.')
  }
  if (input.value <= 0) {
    throw new Error('Discount value must be greater than 0.')
  }
  if (input.type === 'percentage' && input.value > 100) {
    throw new Error('Percentage discount cannot exceed 100%.')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('discounts')
    .update({
      name: input.name.trim(),
      type: input.type,
      value: input.value,
      scope: input.scope,
      requires_reference: input.requires_reference,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error('Failed to update discount.')
  revalidatePath('/admin/discounts')
}

export async function toggleDiscountActive(
  id: string,
  currentStatus: boolean,
): Promise<void> {
  const currentUser = await getCurrentUser()
  if (currentUser.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('discounts')
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error('Failed to update discount status.')
  revalidatePath('/admin/discounts')
}
