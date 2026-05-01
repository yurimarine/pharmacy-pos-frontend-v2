import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { ProductFormData } from '@/types/product'

export type SuggestionTable =
  | 'generic_names'
  | 'brand_names'
  | 'dosage_forms'
  | 'dosage_strengths'
  | 'volumes'
  | 'packaging_types'
  | 'product_categories'
  | 'manufacturers'

export async function upsertSuggestion(
  table: SuggestionTable,
  value: string,
): Promise<void> {
  try {
    const adminClient = createAdminClient()
    await adminClient
      .from(table)
      .upsert({ name: value }, { onConflict: 'name', ignoreDuplicates: true })
  } catch {
    // non-critical — silently ignore
  }
}

export async function upsertProductSuggestions(data: ProductFormData): Promise<void> {
  const tasks: Promise<void>[] = []

  if (data.generic_name) tasks.push(upsertSuggestion('generic_names', data.generic_name))
  if (data.brand_name) tasks.push(upsertSuggestion('brand_names', data.brand_name))
  if (data.dosage_form) tasks.push(upsertSuggestion('dosage_forms', data.dosage_form))
  if (data.dosage_strength) tasks.push(upsertSuggestion('dosage_strengths', data.dosage_strength))
  if (data.volume) tasks.push(upsertSuggestion('volumes', data.volume))
  if (data.packaging_type) tasks.push(upsertSuggestion('packaging_types', data.packaging_type))
  if (data.category) tasks.push(upsertSuggestion('product_categories', data.category))
  if (data.manufacturer) tasks.push(upsertSuggestion('manufacturers', data.manufacturer))

  await Promise.all(tasks)
}

export async function generateSKU(
  genericName: string,
  packagingType: string,
): Promise<string> {
  const supabase = await createClient()

  const genericPrefix = genericName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()
  const packagingPrefix = packagingType.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase()

  for (let i = 0; i < 10; i++) {
    const digits = String(Math.floor(Math.random() * 9000) + 1000)
    const sku = `${genericPrefix}-${packagingPrefix}-${digits}`

    const { data } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .maybeSingle()

    if (!data) return sku
  }

  throw new Error('Failed to generate a unique SKU after 10 retries')
}
