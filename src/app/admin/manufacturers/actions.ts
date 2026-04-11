"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Manufacturer, ManufacturerInput } from "@/types/manufacturer"

export async function getManufacturers(): Promise<Manufacturer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("manufacturers")
    .select("*")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getManufacturerById(id: string): Promise<Manufacturer> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("manufacturers")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createManufacturer(
  data: ManufacturerInput
): Promise<Manufacturer> {
  const supabase = await createClient()
  const { data: manufacturer, error } = await supabase
    .from("manufacturers")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/manufacturers")
  return manufacturer
}

export async function updateManufacturer(
  id: string,
  data: ManufacturerInput
): Promise<Manufacturer> {
  const supabase = await createClient()
  const { data: manufacturer, error } = await supabase
    .from("manufacturers")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/manufacturers")
  return manufacturer
}

export async function deleteManufacturer(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("manufacturers")
    .delete()
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/manufacturers")
}
