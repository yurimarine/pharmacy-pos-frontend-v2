"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ProductCategory } from "@/types/reference-data"

export async function getProductCategories(): Promise<ProductCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_categories")
    .select("*, product_classes(name)")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProductCategoryById(id: string): Promise<ProductCategory> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_categories")
    .select("*, product_classes(name)")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createProductCategory(data: {
  name: string
  description?: string
  class_id: string
}): Promise<ProductCategory> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("product_categories")
    .insert({
      name: data.name,
      description: data.description || null,
      class_id: data.class_id,
    })
    .select("*, product_classes(name)")
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/product-categories")
  return row
}

export async function updateProductCategory(
  id: string,
  data: { name: string; description?: string; class_id: string }
): Promise<ProductCategory> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("product_categories")
    .update({
      name: data.name,
      description: data.description || null,
      class_id: data.class_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, product_classes(name)")
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/product-categories")
  return row
}

export async function deleteProductCategory(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/product-categories")
}

export async function getProductCategoriesForSelect(classId?: string): Promise<
  { id: string; name: string; class_id: string }[]
> {
  const supabase = await createClient()
  let query = supabase
    .from("product_categories")
    .select("id, name, class_id")
    .order("name", { ascending: true })

  if (classId) {
    query = query.eq("class_id", classId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}
