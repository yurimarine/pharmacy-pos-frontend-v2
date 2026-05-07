"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-current-user"
import { generateSKU, upsertProductSuggestions } from "@/lib/suggestions"
import {
  type Product,
  type ProductFormData,
  type ProductSuggestions,
  type ProductType,
  type ProductStatus,
  composeProductName,
} from "@/types/product"

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeText(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null
  return value.trim().toUpperCase()
}

function normalizeRequired(value: string): string {
  return value.trim().toUpperCase()
}

function normalizeFormData(data: ProductFormData) {
  const generic_name = normalizeRequired(data.generic_name)
  const brand_name = normalizeText(data.brand_name)
  const dosage_form = normalizeText(data.dosage_form)
  const dosage_strength = normalizeText(data.dosage_strength)
  const volume = normalizeText(data.volume)
  const packaging_type = normalizeRequired(data.packaging_type)
  const manufacturer = normalizeText(data.manufacturer)
  const category = normalizeText(data.category)

  return {
    generic_name,
    brand_name,
    dosage_form,
    dosage_strength,
    volume,
    packaging_type,
    manufacturer,
    category,
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getProducts(params: {
  search?: string
  type?: ProductType
  status?: ProductStatus
  category?: string
  requires_prescription?: boolean
  page?: number
  pageSize?: number
}): Promise<{ data: Product[]; count: number }> {
  const supabase = await createClient()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("product_name", { ascending: true })

  if (params.search && params.search.trim()) {
    const term = params.search.trim()
    query = query.or(
      `product_name.ilike.%${term}%,generic_name.ilike.%${term}%,sku.ilike.%${term}%,barcode.ilike.%${term}%`,
    )
  }

  if (params.type) {
    query = query.eq("type", params.type)
  }

  if (params.status) {
    query = query.eq("status", params.status)
  }

  if (params.category && params.category.trim()) {
    query = query.eq("category", params.category.trim())
  }

  if (params.requires_prescription !== undefined) {
    query = query.eq("requires_prescription", params.requires_prescription)
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: data ?? [], count: count ?? 0 }
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getProductSuggestions(): Promise<ProductSuggestions> {
  const supabase = await createClient()

  const [
    genericNames,
    brandNames,
    dosageForms,
    dosageStrengths,
    volumes,
    packagingTypes,
    categories,
    manufacturers,
  ] = await Promise.all([
    supabase.from("generic_names").select("id, name").order("name", { ascending: true }),
    supabase.from("brand_names").select("id, name").order("name", { ascending: true }),
    supabase.from("dosage_forms").select("id, name").order("name", { ascending: true }),
    supabase.from("dosage_strengths").select("id, name").order("name", { ascending: true }),
    supabase.from("volumes").select("id, name").order("name", { ascending: true }),
    supabase.from("packaging_types").select("id, name").order("name", { ascending: true }),
    supabase.from("product_categories").select("id, name").order("name", { ascending: true }),
    supabase.from("manufacturers").select("id, name").order("name", { ascending: true }),
  ])

  return {
    genericNames: genericNames.data ?? [],
    brandNames: brandNames.data ?? [],
    dosageForms: dosageForms.data ?? [],
    dosageStrengths: dosageStrengths.data ?? [],
    volumes: volumes.data ?? [],
    packagingTypes: packagingTypes.data ?? [],
    categories: categories.data ?? [],
    manufacturers: manufacturers.data ?? [],
  }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createProduct(
  data: ProductFormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role === "pharmacy_assistant") {
      return { success: false, error: "Unauthorized: insufficient permissions" }
    }

    const normalized = normalizeFormData(data)

    const product_name = composeProductName({
      generic_name: normalized.generic_name,
      brand_name: normalized.brand_name,
      dosage_strength: normalized.dosage_strength,
      dosage_form: normalized.dosage_form,
      packaging_type: normalized.packaging_type,
      unit_count: data.unit_count,
      volume: normalized.volume,
    })

    const sku = await generateSKU(normalized.generic_name, normalized.packaging_type)

    const supabase = await createClient()
    const { error } = await supabase.from("products").insert({
      product_name,
      ...normalized,
      unit_count: data.unit_count,
      type: data.type,
      requires_prescription: data.requires_prescription,
      unit_cost: data.unit_cost,
      status: data.status,
      sku,
      barcode: data.barcode || null,
    })

    if (error) return { success: false, error: error.message }

    void upsertProductSuggestions({ ...data, ...normalized })
    revalidatePath("/admin/products")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function updateProduct(
  id: string,
  data: ProductFormData,
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role === "pharmacy_assistant") {
      return { error: "Unauthorized: insufficient permissions" }
    }

    const normalized = normalizeFormData(data)

    const product_name = composeProductName({
      generic_name: normalized.generic_name,
      brand_name: normalized.brand_name,
      dosage_strength: normalized.dosage_strength,
      dosage_form: normalized.dosage_form,
      packaging_type: normalized.packaging_type,
      unit_count: data.unit_count,
      volume: normalized.volume,
    })

    const supabase = await createClient()
    const { error } = await supabase
      .from("products")
      .update({
        product_name,
        ...normalized,
        unit_count: data.unit_count,
        type: data.type,
        requires_prescription: data.requires_prescription,
        unit_cost: data.unit_cost,
        status: data.status,
        barcode: data.barcode || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) return { error: error.message }

    void upsertProductSuggestions({ ...data, ...normalized })
    revalidatePath("/admin/products")
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
  redirect("/admin/products")
}

export async function deleteProduct(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("products")
      .update({ status: "discontinued", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/products")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role === "pharmacy_assistant") {
      return { success: false, error: "Unauthorized: insufficient permissions" }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("products")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/products")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
