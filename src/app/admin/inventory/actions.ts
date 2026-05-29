"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/get-current-user"
import { getStockStatus } from "@/lib/inventory-utils"
import type {
  PharmacyInventoryWithProduct,
  POSInventoryItem,
  StockAdjustment,
  StockAdjustmentType,
  StockAdjustmentReason,
} from "@/types/inventory"
import type { StockStatus } from "@/types/inventory"

const PHARMACY_INVENTORY_SELECT = `
  id, product_id, pharmacy_id, quantity, selling_price, markup_percentage,
  low_stock_threshold, expiry_date, last_restocked_at, created_at, updated_at,
  product:products!pharmacy_inventory_product_id_fkey(
    id, product_name, generic_name, sku,
    packaging_type, unit_count, requires_prescription, unit_cost
  )
`

const SA_SELECT = `
  id, pharmacy_id, product_id, adjusted_by, type, quantity, reason, notes, created_at,
  adjusted_by_user:users!stock_adjustments_adjusted_by_fkey(name, role),
  product:products!stock_adjustments_product_id_fkey(product_name, sku)
`

function sortByProductName(
  a: PharmacyInventoryWithProduct,
  b: PharmacyInventoryWithProduct,
): number {
  return (a.product?.product_name ?? "").localeCompare(
    b.product?.product_name ?? "",
  )
}

export async function getPharmacyInventory(params: {
  pharmacy_id: string
  search?: string
  status?: StockStatus
  requires_prescription?: boolean
  page?: number
  pageSize?: number
}): Promise<{ data: PharmacyInventoryWithProduct[]; count: number }> {
  const supabase = await createClient()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20

  let query = supabase
    .from("pharmacy_inventory")
    .select(PHARMACY_INVENTORY_SELECT, { count: "exact" })
    .eq("pharmacy_id", params.pharmacy_id)

  // Pre-resolve product IDs for search and/or requires_prescription
  if (params.search?.trim() || params.requires_prescription !== undefined) {
    let productQuery = supabase.from("products").select("id")

    if (params.search?.trim()) {
      const term = params.search.trim()
      productQuery = productQuery.or(
        `product_name.ilike.%${term}%,sku.ilike.%${term}%,generic_name.ilike.%${term}%`,
      )
    }

    if (params.requires_prescription !== undefined) {
      productQuery = productQuery.eq(
        "requires_prescription",
        params.requires_prescription,
      )
    }

    const { data: matchingProducts } = await productQuery
    const productIds = (matchingProducts ?? []).map((p) => p.id)

    if (productIds.length === 0) return { data: [], count: 0 }
    query = query.in("product_id", productIds)
  }

  // Status filter: computed in JS — fetch all rows then slice
  if (params.status) {
    const { data: allData, error } = await query
    if (error) throw new Error(error.message)

    const filtered = (allData as unknown as PharmacyInventoryWithProduct[])
      .filter(
        (row) =>
          getStockStatus(row.quantity, row.low_stock_threshold, row.expiry_date) ===
          params.status,
      )
      .sort(sortByProductName)

    const from = (page - 1) * pageSize
    return { data: filtered.slice(from, from + pageSize), count: filtered.length }
  }

  // No status filter — server-side pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await query.range(from, to)
  if (error) throw new Error(error.message)

  const sorted = (data as unknown as PharmacyInventoryWithProduct[]).sort(
    sortByProductName,
  )
  return { data: sorted, count: count ?? 0 }
}

export async function getPharmacyInventoryById(
  id: string,
): Promise<PharmacyInventoryWithProduct | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pharmacy_inventory")
    .select(PHARMACY_INVENTORY_SELECT)
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as unknown as PharmacyInventoryWithProduct | null
}

export async function getPOSInventory(
  pharmacyId: string,
): Promise<POSInventoryItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("pharmacy_inventory")
    .select(`
      id, product_id, quantity, selling_price, expiry_date, low_stock_threshold,
      product:products!pharmacy_inventory_product_id_fkey(
        id, product_name, generic_name, sku,
        packaging_type, unit_count, requires_prescription, status
      )
    `)
    .eq("pharmacy_id", pharmacyId)
    .gt("quantity", 0)

  if (error) throw new Error(error.message)

  return (data ?? [])
    .filter((row) => {
      const product = row.product as unknown as { status: string } | null
      return product && product.status !== "discontinued"
    })
    .map((row) => {
      const product = row.product as unknown as {
        id: string
        product_name: string
        generic_name: string | null
        sku: string | null
        packaging_type: string
        unit_count: number
        requires_prescription: boolean
        status: string
      }
      return {
        inventory_id: row.id,
        product_id: product.id,
        product_name: product.product_name,
        generic_name: product.generic_name,
        sku: product.sku,
        packaging_type: product.packaging_type,
        unit_count: product.unit_count,
        requires_prescription: product.requires_prescription,
        quantity: row.quantity,
        selling_price: Number(row.selling_price),
        expiry_date: row.expiry_date,
        low_stock_threshold: row.low_stock_threshold,
      }
    })
}

export async function getMissingProductsCount(pharmacyId: string): Promise<number> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("pharmacy_inventory")
    .select("product_id")
    .eq("pharmacy_id", pharmacyId)

  const existingIds = (existing ?? []).map((r) => r.product_id)

  let query = supabase.from("products").select("id", { count: "exact", head: true })
  if (existingIds.length > 0) {
    query = query.not("id", "in", `(${existingIds.join(",")})`)
  }

  const { count } = await query
  return count ?? 0
}

export async function initializePharmacyInventory(
  pharmacyId: string,
  defaults: {
    quantity: number
    low_stock_threshold: number
    markup_percentage: number
    expiry_date: string | null
  },
): Promise<{ added: number; skipped: { id: string; name: string }[] }> {
  const currentUser = await getCurrentUser()
  if (currentUser.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }

  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Fetch already-stocked product IDs
  const { data: existing } = await supabase
    .from("pharmacy_inventory")
    .select("product_id")
    .eq("pharmacy_id", pharmacyId)

  const existingIds = (existing ?? []).map((r) => r.product_id)

  // Fetch all products not yet stocked at this pharmacy
  let productQuery = supabase
    .from("products")
    .select("id, product_name, unit_cost")
  if (existingIds.length > 0) {
    productQuery = productQuery.not("id", "in", `(${existingIds.join(",")})`)
  }

  const { data: missingProducts, error: productsErr } = await productQuery
  if (productsErr) throw new Error(productsErr.message)

  const products = missingProducts ?? []

  // Split into valid (has unit_cost > 0) and skipped
  const valid = products.filter((p) => p.unit_cost && p.unit_cost > 0)
  const skipped = products.filter((p) => !p.unit_cost || p.unit_cost === 0)

  if (valid.length === 0) {
    return {
      added: 0,
      skipped: skipped.map((p) => ({ id: p.id, name: p.product_name })),
    }
  }

  // Bulk insert pharmacy_inventory rows
  const rows = valid.map((p) => ({
    product_id: p.id,
    pharmacy_id: pharmacyId,
    quantity: defaults.quantity,
    selling_price: p.unit_cost! * (1 + defaults.markup_percentage / 100),
    markup_percentage: defaults.markup_percentage,
    low_stock_threshold: defaults.low_stock_threshold,
    expiry_date: defaults.expiry_date,
  }))

  const { data: inserted, error: insertErr } = await supabase
    .from("pharmacy_inventory")
    .insert(rows)
    .select("id, product_id")

  if (insertErr) throw new Error(insertErr.message)

  // Write inventory logs for each inserted row (non-fatal if it fails)
  if (inserted && inserted.length > 0) {
    const logEntries = inserted.map((row) => ({
      entity_type: "pharmacy" as const,
      entity_id: row.id,
      action: "adjusted" as const,
      quantity_before: 0,
      quantity_after: defaults.quantity,
      quantity_change: defaults.quantity,
      reference_type: "adjustment" as const,
      performed_by: currentUser.id,
    }))

    const { error: logErr } = await adminSupabase
      .from("inventory_logs")
      .insert(logEntries)

    if (logErr) console.error("inventory_logs write failed:", logErr.message)
  }

  revalidatePath("/admin/inventory")

  return {
    added: valid.length,
    skipped: skipped.map((p) => ({ id: p.id, name: p.product_name })),
  }
}

export async function bulkUpdatePharmacyInventory(
  ids: string[],
  payload: {
    markup_percentage?: number | null
    selling_price?: number | null
    low_stock_threshold?: number | null
    expiry_date?: string | null
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin" && currentUser.role !== "pharmacist") {
      return { success: false, error: "Unauthorized" }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (payload.markup_percentage !== undefined) updateData.markup_percentage = payload.markup_percentage
    if (payload.selling_price !== undefined) updateData.selling_price = payload.selling_price
    if (payload.low_stock_threshold !== undefined) updateData.low_stock_threshold = payload.low_stock_threshold
    if (payload.expiry_date !== undefined) updateData.expiry_date = payload.expiry_date

    const supabase = await createClient()
    const { error } = await supabase
      .from("pharmacy_inventory")
      .update(updateData)
      .in("id", ids)

    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function getInventoryStats(pharmacyId: string): Promise<{
  total: number
  outOfStock: number
  lowStock: number
  nearExpiry: number
  expired: number
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pharmacy_inventory")
    .select("quantity, low_stock_threshold, expiry_date")
    .eq("pharmacy_id", pharmacyId)

  if (error) throw new Error(error.message)

  const rows = data ?? []
  let outOfStock = 0
  let lowStock = 0
  let nearExpiry = 0
  let expired = 0

  for (const row of rows) {
    const status = getStockStatus(row.quantity, row.low_stock_threshold, row.expiry_date)
    if (status === "out_of_stock") outOfStock++
    else if (status === "low_stock") lowStock++
    else if (status === "near_expiry") nearExpiry++
    else if (status === "expired") expired++
  }

  return { total: rows.length, outOfStock, lowStock, nearExpiry, expired }
}

export async function updatePharmacyInventoryPricing(
  id: string,
  data: { selling_price: number; markup_percentage: number; expiry_date: string | null },
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin" && currentUser.role !== "pharmacist") {
      return { success: false, error: "Unauthorized" }
    }
    if (data.selling_price < 0 || data.markup_percentage < 0) {
      return { success: false, error: "Values must be non-negative" }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("pharmacy_inventory")
      .update({
        selling_price: data.selling_price,
        markup_percentage: data.markup_percentage,
        expiry_date: data.expiry_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

export async function updateLowStockThreshold(
  id: string,
  threshold: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin" && currentUser.role !== "pharmacist") {
      return { success: false, error: "Unauthorized" }
    }
    if (threshold < 0) {
      return { success: false, error: "Threshold must be non-negative" }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("pharmacy_inventory")
      .update({
        low_stock_threshold: threshold,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

export async function updatePharmacyInventory(
  id: string,
  data: {
    selling_price: number
    markup_percentage: number
    expiry_date: string | null
    low_stock_threshold: number
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin" && currentUser.role !== "pharmacist") {
      return { success: false, error: "Unauthorized" }
    }
    if (data.selling_price < 0 || data.markup_percentage < 0) {
      return { success: false, error: "Values must be non-negative" }
    }
    if (data.low_stock_threshold < 0) {
      return { success: false, error: "Threshold must be non-negative" }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from("pharmacy_inventory")
      .update({
        selling_price: data.selling_price,
        markup_percentage: data.markup_percentage,
        expiry_date: data.expiry_date,
        low_stock_threshold: data.low_stock_threshold,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) return { success: false, error: error.message }
    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

export async function createStockAdjustment(data: {
  pharmacy_id: string
  product_id: string
  type: StockAdjustmentType
  quantity: number
  reason: StockAdjustmentReason
  notes: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin" && currentUser.role !== "pharmacist") {
      return { success: false, error: "Unauthorized" }
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Fetch current inventory row
    const { data: invRow, error: fetchErr } = await supabase
      .from("pharmacy_inventory")
      .select("id, quantity")
      .eq("product_id", data.product_id)
      .eq("pharmacy_id", data.pharmacy_id)
      .single()

    if (fetchErr || !invRow) {
      return { success: false, error: "Inventory record not found" }
    }

    const currentQty = invRow.quantity
    const newQty =
      data.type === "increase"
        ? currentQty + data.quantity
        : currentQty - data.quantity

    if (newQty < 0) {
      return {
        success: false,
        error: `Insufficient stock for adjustment. Current: ${currentQty}, requested decrease: ${data.quantity}`,
      }
    }

    // Update quantity
    const { error: updateErr } = await supabase
      .from("pharmacy_inventory")
      .update({ quantity: newQty, updated_at: new Date().toISOString() })
      .eq("id", invRow.id)

    if (updateErr) return { success: false, error: updateErr.message }

    // Insert stock_adjustments row
    const { data: adjustment, error: adjErr } = await supabase
      .from("stock_adjustments")
      .insert({
        pharmacy_id: data.pharmacy_id,
        product_id: data.product_id,
        adjusted_by: currentUser.id,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
      })
      .select("id")
      .single()

    if (adjErr) return { success: false, error: adjErr.message }

    // Write inventory log via adminClient (RLS restricts inserts to service role)
    const { error: logErr } = await adminSupabase
      .from("inventory_logs")
      .insert({
        entity_type: "pharmacy",
        entity_id: invRow.id,
        action: "adjusted",
        quantity_before: currentQty,
        quantity_after: newQty,
        quantity_change: data.type === "increase" ? data.quantity : -data.quantity,
        reference_type: "adjustment",
        reference_id: adjustment.id,
        performed_by: currentUser.id,
      })

    if (logErr) return { success: false, error: logErr.message }

    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

export async function getStockAdjustments(params: {
  pharmacy_id?: string
  product_id?: string
  type?: StockAdjustmentType
  reason?: StockAdjustmentReason
  page?: number
  pageSize?: number
}): Promise<{ data: StockAdjustment[]; count: number }> {
  const supabase = await createClient()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("stock_adjustments")
    .select(SA_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })

  if (params.pharmacy_id) query = query.eq("pharmacy_id", params.pharmacy_id)
  if (params.product_id) query = query.eq("product_id", params.product_id)
  if (params.type) query = query.eq("type", params.type)
  if (params.reason) query = query.eq("reason", params.reason)

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as unknown as StockAdjustment[], count: count ?? 0 }
}
