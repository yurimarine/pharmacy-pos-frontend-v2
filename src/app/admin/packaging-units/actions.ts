"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { PackagingUnit } from "@/types/reference-data"

export async function getPackagingUnits(): Promise<PackagingUnit[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("packaging_units")
    .select("*")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createPackagingUnit(data: {
  name: string
  abbreviation: string
}): Promise<PackagingUnit> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("packaging_units")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/packaging-units")
  return row
}

export async function updatePackagingUnit(
  id: string,
  data: { name: string; abbreviation: string }
): Promise<PackagingUnit> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("packaging_units")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/packaging-units")
  return row
}

export async function deletePackagingUnit(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("packaging_units")
    .delete()
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/packaging-units")
}

export async function getPackagingUnitsForSelect(): Promise<
  { id: string; name: string; abbreviation: string }[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("packaging_units")
    .select("id, name, abbreviation")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
