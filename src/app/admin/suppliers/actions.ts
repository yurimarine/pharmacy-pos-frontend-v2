"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Supplier, SupplierInput } from "@/types/supplier"
import { getCurrentUser, isAdmin } from "@/lib/get-current-user"

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSupplierById(id: string): Promise<Supplier> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createSupplier(data: SupplierInput): Promise<Supplier> {
  const currentUser = await getCurrentUser()
  if (!isAdmin(currentUser)) throw new Error("Unauthorized: Admin access required")
  const supabase = await createClient()
  const { data: supplier, error } = await supabase
    .from("suppliers")
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/suppliers")
  return supplier
}

export async function updateSupplier(
  id: string,
  data: Partial<SupplierInput>
): Promise<Supplier> {
  const currentUser = await getCurrentUser()
  if (!isAdmin(currentUser)) throw new Error("Unauthorized: Admin access required")
  const supabase = await createClient()
  const { data: supplier, error } = await supabase
    .from("suppliers")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/suppliers")
  return supplier
}

export async function deleteSupplier(id: string): Promise<void> {
  const currentUser = await getCurrentUser()
  if (!isAdmin(currentUser)) throw new Error("Unauthorized: Admin access required")
  const supabase = await createClient()
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/suppliers")
}
