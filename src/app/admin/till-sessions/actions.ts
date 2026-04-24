'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/get-current-user'
import { revalidatePath } from 'next/cache'
import type { TillSessionWithRelations } from '@/types/till-session'

export async function getTillSessions(params: {
  pharmacyId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<{ data: TillSessionWithRelations[]; count: number }> {
  const currentUser = await getCurrentUser()
  if (currentUser.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.')
  }

  const supabase = await createClient()

  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Resolve user IDs for search-by-name (PostgREST cannot filter on embedded joins)
  let searchUserIds: string[] | null = null
  if (params.search) {
    const { data: matchingUsers } = await supabase
      .from('users')
      .select('id')
      .ilike('name', `%${params.search}%`)

    searchUserIds = matchingUsers?.map((u) => u.id) ?? []
    if (searchUserIds.length === 0) {
      return { data: [], count: 0 }
    }
  }

  let query = supabase
    .from('till_sessions')
    .select(
      `
      *,
      pharmacies ( name ),
      opened_by_user:users!till_sessions_opened_by_fkey ( name, role ),
      closed_by_user:users!till_sessions_closed_by_fkey ( name )
    `,
      { count: 'exact' },
    )
    .order('opened_at', { ascending: false })
    .range(from, to)

  if (params.pharmacyId) {
    query = query.eq('pharmacy_id', params.pharmacyId)
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }
  if (params.dateFrom) {
    query = query.gte('opened_at', `${params.dateFrom}T00:00:00`)
  }
  if (params.dateTo) {
    query = query.lte('opened_at', `${params.dateTo}T23:59:59`)
  }
  if (searchUserIds !== null) {
    query = query.in('opened_by', searchUserIds)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as unknown as TillSessionWithRelations[],
    count: count ?? 0,
  }
}

export async function forceCloseTillSession(sessionId: string): Promise<void> {
  const currentUser = await getCurrentUser()
  if (currentUser.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.')
  }

  const supabase = await createClient()

  const { data: session, error: fetchError } = await supabase
    .from('till_sessions')
    .select('id, status')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) throw new Error('Till session not found.')
  if (session.status !== 'open') {
    throw new Error('This till session is already closed.')
  }

  const { error } = await supabase
    .from('till_sessions')
    .update({
      status: 'force_closed',
      closed_at: new Date().toISOString(),
      closed_by: currentUser.id,
      closing_notes: 'Force-closed by admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('status', 'open')

  if (error) throw new Error('Failed to force close till session.')

  revalidatePath('/admin/till-sessions')
}
