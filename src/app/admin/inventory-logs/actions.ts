"use server"

import { createClient } from "@/lib/supabase/server"
import type { InventoryLog } from "@/types/inventory-log"

export async function getInventoryLogs(pharmacyId?: string): Promise<InventoryLog[]> {
  const supabase = await createClient()
  let query = supabase
    .from("inventory_logs")
    .select("*, products(name), pharmacies(name), users(name, role)")
    .order("created_at", { ascending: false })

  if (pharmacyId) {
    query = query.eq("pharmacy_id", pharmacyId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPharmaciesForLogsSelect(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pharmacies")
    .select("id, name")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
