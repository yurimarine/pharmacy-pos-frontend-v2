"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Inventory } from "@/types/inventory"

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  const { data } = await supabase
    .from("users")
    .select("id, name, role, pharmacy_id")
    .eq("auth_id", user.id)
    .single()
  if (!data) throw new Error("User record not found")
  return data
}

type InventoryInput = {
  product_id: string
  pharmacy_id: string
  quantity: number
  low_stock_threshold: number
  markup_percentage: number
  selling_price: number
  expiry_date?: string
}

type InventoryUpdateInput = {
  quantity: number
  low_stock_threshold: number
  markup_percentage: number
  selling_price: number
  expiry_date?: string
}

export async function getInventory(pharmacyId?: string): Promise<Inventory[]> {
  const supabase = await createClient()
  let query = supabase
    .from("inventory")
    .select(
      "*, products(name, generic_name, base_price, requires_prescription, product_categories(name)), pharmacies(name)"
    )
    .eq("is_active", true)
    .order("products(name)", { ascending: true })

  if (pharmacyId) {
    query = query.eq("pharmacy_id", pharmacyId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getInventoryById(id: string): Promise<Inventory> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inventory")
    .select(
      "*, products(name, generic_name, base_price, requires_prescription, product_categories(name)), pharmacies(name)"
    )
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createInventoryEntry(
  data: InventoryInput
): Promise<Inventory> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("inventory")
    .select("id")
    .eq("product_id", data.product_id)
    .eq("pharmacy_id", data.pharmacy_id)
    .single()

  if (existing) {
    throw new Error(
      "This product already has an inventory entry for this pharmacy."
    )
  }

  const { data: entry, error } = await supabase
    .from("inventory")
    .insert(data)
    .select(
      "*, products(name, generic_name, base_price, requires_prescription, product_categories(name)), pharmacies(name)"
    )
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/inventory")
  return entry
}

export async function updateInventoryEntry(
  id: string,
  data: InventoryUpdateInput,
  reason: string
): Promise<Inventory> {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  const { data: currentRow, error: fetchError } = await supabase
    .from("inventory")
    .select("quantity, product_id, pharmacy_id")
    .eq("id", id)
    .single()
  if (fetchError) throw new Error(fetchError.message)

  const { data: entry, error } = await supabase
    .from("inventory")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(
      "*, products(name, generic_name, base_price, requires_prescription, product_categories(name)), pharmacies(name)"
    )
    .single()
  if (error) throw new Error(error.message)

  const { error: logError } = await supabase.from("inventory_logs").insert({
    inventory_id: id,
    product_id: currentRow.product_id,
    pharmacy_id: currentRow.pharmacy_id,
    changed_by: currentUser.id,
    change_type: "manual_adjustment",
    previous_quantity: currentRow.quantity,
    new_quantity: data.quantity,
    reason,
  })
  if (logError) throw new Error(logError.message)

  revalidatePath("/admin/inventory")
  revalidatePath("/admin/inventory-logs")
  return entry
}

export async function deactivateInventoryEntry(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("inventory")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/inventory")
}

export async function getPharmaciesForSelect(): Promise<
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

export async function getActiveProductsForInventorySelect(): Promise<
  { id: string; name: string; generic_name: string | null; base_price: number }[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, name, generic_name, base_price")
    .eq("status", "active")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
