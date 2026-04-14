"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Product, ProductType } from "@/types/product"

const PRODUCT_SELECT = `
  *,
  suppliers ( name ),
  manufacturers ( name ),
  product_classes ( name ),
  product_categories ( name ),
  packaging_units ( name, abbreviation ),
  dispensing_units ( name, abbreviation )
` as const

type ProductInput = {
  name: string
  generic_name?: string
  /** @deprecated column removed — accepted for backwards compat but not sent to DB */
  category?: string
  sku?: string
  barcode?: string
  class_id?: string
  category_id?: string
  type: ProductType
  base_price: number
  requires_prescription: boolean
  supplier_id?: string
  manufacturer_id?: string
  packaging_unit_id?: string
  unit_count?: number
  dispensing_unit_id?: string
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .neq("status", "discontinued")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProductById(id: string): Promise<Product> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
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
      sku: data.sku || null,
      barcode: data.barcode || null,
      class_id: data.class_id || null,
      category_id: data.category_id || null,
      type: data.type,
      base_price: data.base_price,
      requires_prescription: data.requires_prescription,
      supplier_id: data.supplier_id || null,
      manufacturer_id: data.manufacturer_id || null,
      packaging_unit_id: data.packaging_unit_id || null,
      unit_count: data.unit_count ?? 1,
      dispensing_unit_id: data.dispensing_unit_id || null,
    })
    .select(PRODUCT_SELECT)
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
      sku: data.sku || null,
      barcode: data.barcode || null,
      class_id: data.class_id || null,
      category_id: data.category_id || null,
      type: data.type,
      base_price: data.base_price,
      requires_prescription: data.requires_prescription,
      supplier_id: data.supplier_id || null,
      manufacturer_id: data.manufacturer_id || null,
      packaging_unit_id: data.packaging_unit_id || null,
      unit_count: data.unit_count ?? 1,
      dispensing_unit_id: data.dispensing_unit_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(PRODUCT_SELECT)
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
  return product
}

export async function discontinueProduct(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("products")
    .update({ status: "discontinued", updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/products")
}

/** @deprecated use discontinueProduct instead */
export const deactivateProduct = discontinueProduct

export async function getProductsForSelect(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .neq("status", "discontinued")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getSuppliersForSelect(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getManufacturersForSelect(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("manufacturers")
    .select("id, name")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProductClassesForProductForm(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_classes")
    .select("id, name")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProductCategoriesForProductForm(
  classId: string
): Promise<{ id: string; name: string; class_id: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, name, class_id")
    .eq("class_id", classId)
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getPackagingUnitsForProductForm(): Promise<
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

export async function getDispensingUnitsForProductForm(): Promise<
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

export async function generateSkuAction(prefix: string): Promise<string> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .ilike("sku", `${prefix}-%`)
  const sequence = String((count ?? 0) + 1).padStart(3, "0")
  return `${prefix}-${sequence}`
}
