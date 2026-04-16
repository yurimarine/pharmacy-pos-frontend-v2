"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { DispensingUnit } from "@/types/reference-data"
import { getCurrentUser, isAdmin } from "@/lib/get-current-user"

export async function getDispensingUnits(): Promise<DispensingUnit[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("dispensing_units")
    .select("*")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createDispensingUnit(data: {
  name: string
  abbreviation: string
}): Promise<DispensingUnit> {
  const currentUser = await getCurrentUser()
  if (!isAdmin(currentUser)) throw new Error("Unauthorized: Admin access required")
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("dispensing_units")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/dispensing-units")
  return row
}

export async function updateDispensingUnit(
  id: string,
  data: { name: string; abbreviation: string }
): Promise<DispensingUnit> {
  const currentUser = await getCurrentUser()
  if (!isAdmin(currentUser)) throw new Error("Unauthorized: Admin access required")
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("dispensing_units")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/dispensing-units")
  return row
}

export async function deleteDispensingUnit(id: string): Promise<void> {
  const currentUser = await getCurrentUser()
  if (!isAdmin(currentUser)) throw new Error("Unauthorized: Admin access required")
  const supabase = await createClient()
  const { error } = await supabase
    .from("dispensing_units")
    .delete()
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/dispensing-units")
}

export async function getDispensingUnitsForSelect(): Promise<
  { id: string; name: string; abbreviation: string }[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("dispensing_units")
    .select("id, name, abbreviation")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
