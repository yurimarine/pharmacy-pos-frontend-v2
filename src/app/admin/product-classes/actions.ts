"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ProductClass } from "@/types/reference-data"

export async function getProductClasses(): Promise<ProductClass[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_classes")
    .select("*")
    .order("name", { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProductClassById(id: string): Promise<ProductClass> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_classes")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createProductClass(data: {
  name: string
  description?: string
}): Promise<ProductClass> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("product_classes")
    .insert({
      name: data.name,
      description: data.description || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/product-classes")
  return row
}

export async function updateProductClass(
  id: string,
  data: { name: string; description?: string }
): Promise<ProductClass> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("product_classes")
    .update({
      name: data.name,
      description: data.description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath("/admin/product-classes")
  return row
}

export async function deleteProductClass(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("product_classes")
    .delete()
    .eq("id", id)
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "Cannot delete this class because it has categories linked to it. Remove the categories first."
      )
    }
    throw new Error(error.message)
  }
  revalidatePath("/admin/product-classes")
}

export async function getProductClassesForSelect(): Promise<
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
