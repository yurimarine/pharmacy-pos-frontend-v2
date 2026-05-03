"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/get-current-user"
import type {
  WarehouseReceiptStatus,
  WarehouseReceiptWithItems,
} from "@/types/warehouse-receipt"

const ITEMS_SELECT =
  "id, receipt_id, product_id, po_item_id, quantity_received, unit_cost, lot_number, expiry_date, notes, products(product_name, sku)"

const WR_SELECT = `
  id, receipt_number, po_id, supplier_id, status, notes, received_by, received_at, created_at, updated_at,
  supplier:suppliers!warehouse_receipts_supplier_id_fkey(id, name),
  po:purchase_orders!warehouse_receipts_po_id_fkey(id, po_number),
  received_by_user:users!warehouse_receipts_received_by_fkey(name, role),
  items:warehouse_receipt_items!warehouse_receipt_items_receipt_id_fkey(${ITEMS_SELECT})
`

export async function getWarehouseReceipts(params: {
  search?: string
  status?: WarehouseReceiptStatus
  supplier_id?: string
  page?: number
  pageSize?: number
}): Promise<{ data: WarehouseReceiptWithItems[]; count: number }> {
  const supabase = await createClient()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("warehouse_receipts")
    .select(WR_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })

  if (params.search?.trim()) {
    query = query.ilike("receipt_number", `%${params.search.trim()}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status)
  }

  if (params.supplier_id) {
    query = query.eq("supplier_id", params.supplier_id)
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as unknown as WarehouseReceiptWithItems[], count: count ?? 0 }
}

export async function getWarehouseReceiptById(
  id: string,
): Promise<WarehouseReceiptWithItems | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("warehouse_receipts")
    .select(WR_SELECT)
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as unknown as WarehouseReceiptWithItems | null
}

export async function createWarehouseReceipt(data: {
  supplier_id: string | null
  po_id: string | null
  notes: string | null
  items: {
    product_id: string
    quantity_received: number
    unit_cost: number
    lot_number: string | null
    expiry_date: string | null
    notes: string | null
  }[]
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "At least one item is required" }
    }

    const supabase = await createClient()

    const { data: wr, error: wrError } = await supabase
      .from("warehouse_receipts")
      .insert({
        supplier_id: data.supplier_id,
        po_id: data.po_id,
        notes: data.notes,
        status: "draft",
        received_by: currentUser.id,
      })
      .select("id, receipt_number")
      .single()

    if (wrError) return { success: false, error: wrError.message }

    const { error: itemsError } = await supabase
      .from("warehouse_receipt_items")
      .insert(
        data.items.map(item => ({
          receipt_id: wr.id,
          product_id: item.product_id,
          quantity_received: item.quantity_received,
          unit_cost: item.unit_cost,
          lot_number: item.lot_number,
          expiry_date: item.expiry_date,
          notes: item.notes,
        })),
      )

    if (itemsError) return { success: false, error: itemsError.message }

    revalidatePath("/admin/warehouse-receipts")
    return { success: true, id: wr.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function updateWarehouseReceipt(
  id: string,
  data: {
    supplier_id: string | null
    po_id: string | null
    notes: string | null
    items: {
      product_id: string
      quantity_received: number
      unit_cost: number
      lot_number: string | null
      expiry_date: string | null
      notes: string | null
    }[]
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const supabase = await createClient()

    const { data: existing, error: fetchError } = await supabase
      .from("warehouse_receipts")
      .select("status")
      .eq("id", id)
      .single()

    if (fetchError) return { success: false, error: fetchError.message }
    if (existing.status !== "draft") {
      return { success: false, error: "Only draft receipts can be edited" }
    }

    const { error: wrError } = await supabase
      .from("warehouse_receipts")
      .update({
        supplier_id: data.supplier_id,
        po_id: data.po_id,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (wrError) return { success: false, error: wrError.message }

    const { error: deleteError } = await supabase
      .from("warehouse_receipt_items")
      .delete()
      .eq("receipt_id", id)

    if (deleteError) return { success: false, error: deleteError.message }

    const { error: itemsError } = await supabase
      .from("warehouse_receipt_items")
      .insert(
        data.items.map(item => ({
          receipt_id: id,
          product_id: item.product_id,
          quantity_received: item.quantity_received,
          unit_cost: item.unit_cost,
          lot_number: item.lot_number,
          expiry_date: item.expiry_date,
          notes: item.notes,
        })),
      )

    if (itemsError) return { success: false, error: itemsError.message }

    revalidatePath("/admin/warehouse-receipts")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function completeWarehouseReceipt(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Fetch receipt including po_id and items
    const { data: receipt, error: fetchError } = await supabase
      .from("warehouse_receipts")
      .select(
        `id, status, po_id, items:warehouse_receipt_items!warehouse_receipt_items_receipt_id_fkey(id, product_id, quantity_received, unit_cost, lot_number, expiry_date)`,
      )
      .eq("id", id)
      .single()

    if (fetchError) return { success: false, error: fetchError.message }
    if (receipt.status !== "draft") {
      return { success: false, error: "Only draft receipts can be completed" }
    }
    if (!receipt.items || receipt.items.length === 0) {
      return { success: false, error: "Cannot complete a receipt with no items" }
    }

    type ReceiptItem = {
      id: string
      product_id: string
      quantity_received: number
      unit_cost: number
      lot_number: string | null
      expiry_date: string | null
    }

    // Insert warehouse_inventory rows (one per receipt item)
    const { data: inventoryRows, error: inventoryError } = await supabase
      .from("warehouse_inventory")
      .insert(
        (receipt.items as ReceiptItem[]).map(item => ({
          product_id: item.product_id,
          receipt_item_id: item.id,
          lot_number: item.lot_number,
          expiry_date: item.expiry_date,
          quantity_remaining: item.quantity_received,
          unit_cost: item.unit_cost,
        })),
      )
      .select("id, quantity_remaining")

    if (inventoryError) return { success: false, error: inventoryError.message }

    // Write inventory_logs via admin client — RLS restricts inserts to service role
    const { error: logsError } = await adminSupabase
      .from("inventory_logs")
      .insert(
        (inventoryRows ?? []).map((row: { id: string; quantity_remaining: number }) => ({
          entity_type: "warehouse",
          entity_id: row.id,
          action: "received",
          quantity_before: 0,
          quantity_after: row.quantity_remaining,
          quantity_change: row.quantity_remaining,
          reference_type: "receipt",
          reference_id: id,
          performed_by: currentUser.id,
        })),
      )

    if (logsError) return { success: false, error: logsError.message }

    // Mark receipt completed
    const { error: updateError } = await supabase
      .from("warehouse_receipts")
      .update({
        status: "completed",
        received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) return { success: false, error: updateError.message }

    // Update linked PO status if this receipt was tied to a PO
    if (receipt.po_id) {
      const { data: poItems } = await supabase
        .from("purchase_order_items")
        .select("product_id")
        .eq("po_id", receipt.po_id)

      const receivedProductIds = new Set(
        (receipt.items as ReceiptItem[]).map(item => item.product_id),
      )
      const allCovered = (poItems ?? []).every(poItem =>
        receivedProductIds.has(poItem.product_id),
      )

      await supabase
        .from("purchase_orders")
        .update({
          status: allCovered ? "received" : "partially_received",
          updated_at: new Date().toISOString(),
        })
        .eq("id", receipt.po_id)
    }

    revalidatePath("/admin/warehouse-receipts")
    revalidatePath("/admin/purchase-orders")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function cancelWarehouseReceipt(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const supabase = await createClient()

    const { data: existing, error: fetchError } = await supabase
      .from("warehouse_receipts")
      .select("status")
      .eq("id", id)
      .single()

    if (fetchError) return { success: false, error: fetchError.message }
    if (existing.status === "completed" || existing.status === "cancelled") {
      return {
        success: false,
        error: `Cannot cancel a receipt with status '${existing.status}'`,
      }
    }

    const { error } = await supabase
      .from("warehouse_receipts")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/warehouse-receipts")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
