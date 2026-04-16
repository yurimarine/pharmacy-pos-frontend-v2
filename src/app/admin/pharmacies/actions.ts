"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Pharmacy, PharmacyInput } from "@/types/pharmacy"
import { getCurrentUser, isAdmin } from "@/lib/get-current-user"

export async function getPharmacies(): Promise<Pharmacy[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pharmacies")
    .select("*")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPharmacyById(id: string): Promise<Pharmacy> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pharmacies")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createPharmacy(data: PharmacyInput): Promise<Pharmacy> {
  const currentUser = await getCurrentUser()
  if (!isAdmin(currentUser)) throw new Error("Unauthorized: Admin access required")
  const supabase = await createClient()
  const { data: pharmacy, error } = await supabase
    .from("pharmacies")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/pharmacies")
  return pharmacy
}

export async function updatePharmacy(
  id: string,
  data: PharmacyInput
): Promise<Pharmacy> {
  const currentUser = await getCurrentUser()
  if (!isAdmin(currentUser)) throw new Error("Unauthorized: Admin access required")
  const supabase = await createClient()
  const { data: pharmacy, error } = await supabase
    .from("pharmacies")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/pharmacies")
  return pharmacy
}

export async function deletePharmacy(id: string): Promise<void> {
  const currentUser = await getCurrentUser()
  if (!isAdmin(currentUser)) throw new Error("Unauthorized: Admin access required")
  const supabase = await createClient()
  const { error } = await supabase
    .from("pharmacies")
    .delete()
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/pharmacies")
}
