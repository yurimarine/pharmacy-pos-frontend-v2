"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Product, ProductType } from "@/types/product"

type ProductInput = {
  name: string
  generic_name?: string
  category?: string
  type: ProductType
  base_price: number
  requires_prescription: boolean
  supplier_id?: string
  manufacturer_id?: string
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*, suppliers(name), manufacturers(name)")
    .eq("is_active", true)
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProductById(id: string): Promise<Product> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*, suppliers(name), manufacturers(name)")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createProduct(data: ProductInput): Promise<Product> {
  const supabase = await createClient()
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: data.name,
      generic_name: data.generic_name || null,
      category: data.category || null,
      type: data.type,
      base_price: data.base_price,
      requires_prescription: data.requires_prescription,
      supplier_id: data.supplier_id || null,
      manufacturer_id: data.manufacturer_id || null,
    })
    .select("*, suppliers(name), manufacturers(name)")
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
  return product
}

export async function updateProduct(
  id: string,
  data: ProductInput
): Promise<Product> {
  const supabase = await createClient()
  const { data: product, error } = await supabase
    .from("products")
    .update({
      name: data.name,
      generic_name: data.generic_name || null,
      category: data.category || null,
      type: data.type,
      base_price: data.base_price,
      requires_prescription: data.requires_prescription,
      supplier_id: data.supplier_id || null,
      manufacturer_id: data.manufacturer_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, suppliers(name), manufacturers(name)")
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
  return product
}

export async function deactivateProduct(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
}

export async function getProductsForSelect(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSuppliersForSelect(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getManufacturersForSelect(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("manufacturers")
    .select("id, name")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
