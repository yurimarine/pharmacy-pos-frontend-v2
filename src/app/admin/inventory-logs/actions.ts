"use server"

import { createClient } from "@/lib/supabase/server"
import type {
  InventoryLogWithDetails,
  InventoryLogEntityType,
  InventoryLogAction,
} from "@/types/inventory"

const INVENTORY_LOG_SELECT = `
  id, entity_type, entity_id, action,
  quantity_before, quantity_after, quantity_change,
  reference_type, reference_id, performed_by, notes, created_at,
  performed_by_user:users!inventory_logs_performed_by_fkey(name, role)
`

export async function getInventoryLogs(params: {
  entity_type?: InventoryLogEntityType
  action?: InventoryLogAction
  performed_by?: string
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  pageSize?: number
} = {}): Promise<{ data: InventoryLogWithDetails[]; count: number }> {
  const supabase = await createClient()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // For search: pre-resolve matching user IDs (cannot .ilike() on joined columns)
  let userIdFilter: string[] | string | null = null
  if (params.search?.trim()) {
    const { data: matchingUsers } = await supabase
      .from("users")
      .select("id")
      .ilike("name", `%${params.search.trim()}%`)
    const userIds = (matchingUsers ?? []).map((u) => u.id)
    if (userIds.length === 0) return { data: [], count: 0 }
    userIdFilter = userIds
  } else if (params.performed_by) {
    userIdFilter = params.performed_by
  }

  let query = supabase
    .from("inventory_logs")
    .select(INVENTORY_LOG_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })

  if (Array.isArray(userIdFilter)) {
    query = query.in("performed_by", userIdFilter)
  } else if (typeof userIdFilter === "string") {
    query = query.eq("performed_by", userIdFilter)
  }

  if (params.entity_type) query = query.eq("entity_type", params.entity_type)
  if (params.action) query = query.eq("action", params.action)
  if (params.date_from) query = query.gte("created_at", params.date_from)
  if (params.date_to) query = query.lte("created_at", params.date_to + "T23:59:59")

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return {
    data: (data ?? []) as unknown as InventoryLogWithDetails[],
    count: count ?? 0,
  }
}
