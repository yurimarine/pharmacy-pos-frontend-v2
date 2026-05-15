"use server"

import { createClient } from "@/lib/supabase/server"
import { getStockStatus } from "@/lib/inventory-utils"

export type AlertItem = {
  id: string
  productName: string
  pharmacyName: string
  pharmacyId: string
  quantity?: number
  expiryDate?: string
  threshold?: number
}

export type NotificationAlerts = {
  expired: AlertItem[]
  nearExpiry: AlertItem[]
  outOfStock: AlertItem[]
  lowStock: AlertItem[]
  total: number
}

export async function getNotificationAlerts(pharmacyId?: string | null): Promise<NotificationAlerts> {
  const supabase = await createClient()

  let query = supabase
    .from("pharmacy_inventory")
    .select(
      "id, quantity, low_stock_threshold, expiry_date, pharmacy_id, products(product_name), pharmacies(name)"
    )

  if (pharmacyId) {
    query = query.eq("pharmacy_id", pharmacyId)
  }

  const { data, error } = await query

  if (error || !data) {
    return { expired: [], nearExpiry: [], outOfStock: [], lowStock: [], total: 0 }
  }

  const result: NotificationAlerts = {
    expired: [],
    nearExpiry: [],
    outOfStock: [],
    lowStock: [],
    total: 0,
  }

  for (const row of data) {
    const status = getStockStatus(row.quantity, row.low_stock_threshold, row.expiry_date)
    if (status === "in_stock") continue

    const base: AlertItem = {
      id: row.id,
      productName: (row.products as unknown as { product_name: string } | null)?.product_name ?? "Unknown",
      pharmacyName: (row.pharmacies as unknown as { name: string } | null)?.name ?? "Unknown",
      pharmacyId: row.pharmacy_id,
    }

    if (status === "expired") {
      result.expired.push({ ...base, quantity: row.quantity, expiryDate: row.expiry_date ?? undefined })
    } else if (status === "near_expiry") {
      result.nearExpiry.push({ ...base, quantity: row.quantity, expiryDate: row.expiry_date ?? undefined })
    } else if (status === "out_of_stock") {
      result.outOfStock.push(base)
    } else if (status === "low_stock") {
      result.lowStock.push({ ...base, quantity: row.quantity, threshold: row.low_stock_threshold })
    }
  }

  result.total =
    result.expired.length +
    result.nearExpiry.length +
    result.outOfStock.length +
    result.lowStock.length

  return result
}
