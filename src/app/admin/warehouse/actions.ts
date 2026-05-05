"use server"

import { createClient } from "@/lib/supabase/server"
import type { WarehouseInventoryWithProduct } from "@/types/inventory"

const WAREHOUSE_INVENTORY_SELECT = `
  id, product_id, receipt_item_id, lot_number, expiry_date, quantity_remaining, unit_cost, created_at, updated_at,
  product:products!warehouse_inventory_product_id_fkey(
    id, product_name, generic_name, sku,
    packaging_type, unit_count, requires_prescription, unit_cost
  )
`

export async function getWarehouseInventory(params: {
  search?: string
  product_id?: string
  has_stock?: boolean
  expiring_within_days?: number
  page?: number
  pageSize?: number
}): Promise<{ data: WarehouseInventoryWithProduct[]; count: number }> {
  const supabase = await createClient()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("warehouse_inventory")
    .select(WAREHOUSE_INVENTORY_SELECT, { count: "exact" })
    .order("expiry_date", { ascending: true, nullsFirst: false })

  // Search: resolve product IDs first (cannot ilike on joined cols)
  if (params.search?.trim()) {
    const term = params.search.trim()
    const { data: matchingProducts } = await supabase
      .from("products")
      .select("id")
      .or(`product_name.ilike.%${term}%,sku.ilike.%${term}%,generic_name.ilike.%${term}%`)

    const productIds = (matchingProducts ?? []).map(p => p.id)

    if (productIds.length > 0) {
      query = query.or(
        `lot_number.ilike.%${term}%,product_id.in.(${productIds.join(",")})`,
      )
    } else {
      query = query.ilike("lot_number", `%${term}%`)
    }
  }

  if (params.product_id) {
    query = query.eq("product_id", params.product_id)
  }

  if (params.has_stock === true) {
    query = query.gt("quantity_remaining", 0)
  } else if (params.has_stock === false) {
    query = query.eq("quantity_remaining", 0)
  }

  if (params.expiring_within_days !== undefined) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split("T")[0]

    if (params.expiring_within_days < 0) {
      // Expired: expiry_date is not null AND past today
      query = query.not("expiry_date", "is", null).lt("expiry_date", todayStr)
    } else {
      // Expiring within N days: between today and today+N
      const future = new Date(
        today.getTime() + params.expiring_within_days * 24 * 60 * 60 * 1000,
      )
      const futureStr = future.toISOString().split("T")[0]
      query = query
        .not("expiry_date", "is", null)
        .gte("expiry_date", todayStr)
        .lte("expiry_date", futureStr)
    }
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return {
    data: (data ?? []) as unknown as WarehouseInventoryWithProduct[],
    count: count ?? 0,
  }
}

export async function getWarehouseInventoryStats(): Promise<{
  total: number
  inStock: number
  expiringSoon: number
}> {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split("T")[0]
  const in60Days = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000)
  const in60DaysStr = in60Days.toISOString().split("T")[0]

  const [{ count: total }, { count: inStock }, { count: expiringSoon }] =
    await Promise.all([
      supabase
        .from("warehouse_inventory")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("warehouse_inventory")
        .select("*", { count: "exact", head: true })
        .gt("quantity_remaining", 0),
      supabase
        .from("warehouse_inventory")
        .select("*", { count: "exact", head: true })
        .not("expiry_date", "is", null)
        .gte("expiry_date", todayStr)
        .lte("expiry_date", in60DaysStr),
    ])

  return {
    total: total ?? 0,
    inStock: inStock ?? 0,
    expiringSoon: expiringSoon ?? 0,
  }
}

export async function getAvailableBatchesForProduct(
  productId: string,
): Promise<WarehouseInventoryWithProduct[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("warehouse_inventory")
    .select(WAREHOUSE_INVENTORY_SELECT)
    .eq("product_id", productId)
    .gt("quantity_remaining", 0)
    .order("expiry_date", { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as WarehouseInventoryWithProduct[]
}

export async function getWarehouseQuantityByProduct(
  productId: string,
): Promise<{ product_id: string; total_quantity: number }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("warehouse_inventory")
    .select("quantity_remaining")
    .eq("product_id", productId)
    .gt("quantity_remaining", 0)

  if (error) throw new Error(error.message)

  const total_quantity = (data ?? []).reduce(
    (sum, row) => sum + (row.quantity_remaining ?? 0),
    0,
  )

  return { product_id: productId, total_quantity }
}
