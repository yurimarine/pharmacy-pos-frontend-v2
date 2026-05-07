"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-current-user"
import type {
  StockTransferStatus,
  StockTransferWithItems,
} from "@/types/inventory"

const ITEMS_SELECT = `
  id, transfer_id, warehouse_inventory_id, product_id, quantity, expiry_date,
  product:products!stock_transfer_items_product_id_fkey(product_name, sku),
  batch:warehouse_inventory!stock_transfer_items_warehouse_inventory_id_fkey(lot_number)
`

const ST_SELECT = `
  id, transfer_number, to_pharmacy_id, status, notes, transferred_by, transferred_at, created_at, updated_at,
  to_pharmacy:pharmacies!stock_transfers_to_pharmacy_id_fkey(id, name),
  transferred_by_user:users!stock_transfers_transferred_by_fkey(name, role),
  items:stock_transfer_items!stock_transfer_items_transfer_id_fkey(${ITEMS_SELECT})
`

export async function getStockTransfers(params: {
  search?: string
  status?: StockTransferStatus
  pharmacy_id?: string
  page?: number
  pageSize?: number
}): Promise<{ data: StockTransferWithItems[]; count: number }> {
  const supabase = await createClient()
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("stock_transfers")
    .select(ST_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })

  if (params.search?.trim()) {
    query = query.ilike("transfer_number", `%${params.search.trim()}%`)
  }

  if (params.status) {
    query = query.eq("status", params.status)
  }

  if (params.pharmacy_id) {
    query = query.eq("to_pharmacy_id", params.pharmacy_id)
  }

  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { data: (data ?? []) as unknown as StockTransferWithItems[], count: count ?? 0 }
}

export async function getStockTransferById(
  id: string,
): Promise<StockTransferWithItems | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("stock_transfers")
    .select(ST_SELECT)
    .eq("id", id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as unknown as StockTransferWithItems | null
}

export async function getStockTransferStats(): Promise<{
  total: number
  draft: number
  completed: number
}> {
  const supabase = await createClient()
  const [{ count: total }, { count: draft }, { count: completed }] = await Promise.all([
    supabase.from("stock_transfers").select("*", { count: "exact", head: true }),
    supabase.from("stock_transfers").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("stock_transfers").select("*", { count: "exact", head: true }).eq("status", "completed"),
  ])
  return { total: total ?? 0, draft: draft ?? 0, completed: completed ?? 0 }
}

export async function createStockTransfer(data: {
  to_pharmacy_id: string
  notes: string | null
  items: {
    warehouse_inventory_id: string
    product_id: string
    quantity: number
    expiry_date: string | null
  }[]
}): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin") {
      return { error: "Unauthorized: Admin access required" }
    }

    if (!data.items || data.items.length === 0) {
      return { error: "At least one item is required" }
    }

    const supabase = await createClient()

    const { data: st, error: stError } = await supabase
      .from("stock_transfers")
      .insert({
        to_pharmacy_id: data.to_pharmacy_id,
        notes: data.notes,
        status: "draft",
        transferred_by: currentUser.id,
      })
      .select("id, transfer_number")
      .single()

    if (stError) return { error: stError.message }

    const { error: itemsError } = await supabase
      .from("stock_transfer_items")
      .insert(
        data.items.map(item => ({
          transfer_id: st.id,
          warehouse_inventory_id: item.warehouse_inventory_id,
          product_id: item.product_id,
          quantity: item.quantity,
          expiry_date: item.expiry_date,
        })),
      )

    if (itemsError) return { error: itemsError.message }

    revalidatePath("/admin/stock-transfers")
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
  redirect("/admin/stock-transfers")
}

export async function updateStockTransfer(
  id: string,
  data: {
    to_pharmacy_id: string
    notes: string | null
    items: {
      warehouse_inventory_id: string
      product_id: string
      quantity: number
      expiry_date: string | null
    }[]
  },
): Promise<{ error: string } | undefined> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin") {
      return { error: "Unauthorized: Admin access required" }
    }

    const supabase = await createClient()

    const { data: existing, error: fetchError } = await supabase
      .from("stock_transfers")
      .select("status")
      .eq("id", id)
      .single()

    if (fetchError) return { error: fetchError.message }
    if (existing.status !== "draft") {
      return { error: "Only draft transfers can be edited" }
    }

    const { error: stError } = await supabase
      .from("stock_transfers")
      .update({
        to_pharmacy_id: data.to_pharmacy_id,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (stError) return { error: stError.message }

    const { error: deleteError } = await supabase
      .from("stock_transfer_items")
      .delete()
      .eq("transfer_id", id)

    if (deleteError) return { error: deleteError.message }

    const { error: itemsError } = await supabase
      .from("stock_transfer_items")
      .insert(
        data.items.map(item => ({
          transfer_id: id,
          warehouse_inventory_id: item.warehouse_inventory_id,
          product_id: item.product_id,
          quantity: item.quantity,
          expiry_date: item.expiry_date,
        })),
      )

    if (itemsError) return { error: itemsError.message }

    revalidatePath("/admin/stock-transfers")
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" }
  }
  redirect("/admin/stock-transfers")
}

export async function completeStockTransfer(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: transfer, error: fetchError } = await supabase
      .from("stock_transfers")
      .select(`
        id, status, to_pharmacy_id,
        items:stock_transfer_items!stock_transfer_items_transfer_id_fkey(
          id, warehouse_inventory_id, product_id, quantity, expiry_date
        )
      `)
      .eq("id", id)
      .single()

    if (fetchError) return { success: false, error: fetchError.message }
    if (transfer.status !== "draft") {
      return { success: false, error: "Only draft transfers can be completed" }
    }
    if (!transfer.items?.length) {
      return { success: false, error: "Cannot complete a transfer with no items" }
    }

    type TransferItem = {
      id: string
      warehouse_inventory_id: string
      product_id: string
      quantity: number
      expiry_date: string | null
    }

    const items = transfer.items as TransferItem[]

    // Group by warehouse_inventory_id to validate totals
    const batchTotals = new Map<string, number>()
    for (const item of items) {
      batchTotals.set(
        item.warehouse_inventory_id,
        (batchTotals.get(item.warehouse_inventory_id) ?? 0) + item.quantity,
      )
    }

    const { data: warehouseRows, error: whError } = await supabase
      .from("warehouse_inventory")
      .select("id, quantity_remaining")
      .in("id", [...batchTotals.keys()])

    if (whError) return { success: false, error: whError.message }

    const warehouseMap = new Map((warehouseRows ?? []).map(r => [r.id, r]))

    // Validate ALL items before any mutation
    const errors: string[] = []
    for (const [wId, totalQty] of batchTotals.entries()) {
      const wRow = warehouseMap.get(wId)
      if (!wRow) {
        errors.push(`Warehouse batch not found`)
      } else if (wRow.quantity_remaining < totalQty) {
        errors.push(
          `Insufficient stock in batch: need ${totalQty}, available ${wRow.quantity_remaining}`,
        )
      }
    }
    if (errors.length > 0) return { success: false, error: errors.join("; ") }

    // Deduct warehouse inventory
    const logEntries: object[] = []
    for (const [wId, totalQty] of batchTotals.entries()) {
      const wRow = warehouseMap.get(wId)!
      const newQty = wRow.quantity_remaining - totalQty

      const { error: updateErr } = await supabase
        .from("warehouse_inventory")
        .update({ quantity_remaining: newQty, updated_at: new Date().toISOString() })
        .eq("id", wId)

      if (updateErr) return { success: false, error: updateErr.message }

      logEntries.push({
        entity_type: "warehouse",
        entity_id: wId,
        action: "transferred_out",
        quantity_before: wRow.quantity_remaining,
        quantity_after: newQty,
        quantity_change: -totalQty,
        reference_type: "transfer",
        reference_id: id,
        performed_by: currentUser.id,
      })
    }

    const { error: logsError } = await adminSupabase
      .from("inventory_logs")
      .insert(logEntries)
    if (logsError) return { success: false, error: logsError.message }

    // Upsert pharmacy inventory for each item via RPC
    for (const item of items) {
      const { error: rpcError } = await supabase.rpc(
        "upsert_pharmacy_inventory_on_transfer",
        {
          p_product_id: item.product_id,
          p_pharmacy_id: transfer.to_pharmacy_id,
          p_quantity: item.quantity,
          p_expiry_date: item.expiry_date,
        },
      )
      if (rpcError) return { success: false, error: rpcError.message }
    }

    const { error: updateError } = await supabase
      .from("stock_transfers")
      .update({
        status: "completed",
        transferred_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) return { success: false, error: updateError.message }

    revalidatePath("/admin/stock-transfers")
    revalidatePath("/admin/warehouse")
    revalidatePath("/admin/inventory")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}

export async function cancelStockTransfer(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    const supabase = await createClient()

    const { data: existing, error: fetchError } = await supabase
      .from("stock_transfers")
      .select("status")
      .eq("id", id)
      .single()

    if (fetchError) return { success: false, error: fetchError.message }
    if (existing.status === "completed" || existing.status === "cancelled") {
      return {
        success: false,
        error: `Cannot cancel a transfer with status '${existing.status}'`,
      }
    }

    const { error } = await supabase
      .from("stock_transfers")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) return { success: false, error: error.message }

    revalidatePath("/admin/stock-transfers")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
