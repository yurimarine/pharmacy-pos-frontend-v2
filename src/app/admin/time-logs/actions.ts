'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/get-current-user'
import type { TillSessionWithRelations } from '@/types/till-session'

export async function getTimeLogs(params: {
  pharmacyId?: string
  role?: string
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

  // Resolve user IDs upfront for role and search filters
  // (PostgREST cannot filter on embedded join columns)
  let openedByUserIds: string[] | null = null
  if (params.search || params.role) {
    let userQuery = supabase.from('users').select('id')
    if (params.search) {
      userQuery = userQuery.ilike('name', `%${params.search}%`)
    }
    if (params.role) {
      userQuery = userQuery.eq('role', params.role)
    }
    const { data: matchingUsers } = await userQuery
    openedByUserIds = matchingUsers?.map((u) => u.id) ?? []
    if (openedByUserIds.length === 0) {
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
  if (params.dateFrom) {
    query = query.gte('opened_at', `${params.dateFrom}T00:00:00`)
  }
  if (params.dateTo) {
    query = query.lte('opened_at', `${params.dateTo}T23:59:59`)
  }
  if (openedByUserIds !== null) {
    query = query.in('opened_by', openedByUserIds)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as unknown as TillSessionWithRelations[],
    count: count ?? 0,
  }
}
