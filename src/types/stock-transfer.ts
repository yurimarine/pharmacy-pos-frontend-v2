export type StockTransferStatus = "draft" | "completed" | "cancelled"

export const ST_STATUS_LABELS: Record<StockTransferStatus, string> = {
  draft: "Draft",
  completed: "Completed",
  cancelled: "Cancelled",
}

export type StockTransferItem = {
  id: string
  transfer_id: string
  warehouse_inventory_id: string
  product_id: string
  quantity: number
  expiry_date: string | null
  product: { product_name: string; sku: string | null } | null
  batch: { lot_number: string | null } | null
}

export type StockTransfer = {
  id: string
  transfer_number: string
  to_pharmacy_id: string
  status: StockTransferStatus
  notes: string | null
  transferred_by: string
  transferred_at: string | null
  created_at: string
  updated_at: string
}

export type StockTransferWithItems = StockTransfer & {
  to_pharmacy: { id: string; name: string } | null
  transferred_by_user: { name: string; role: string } | null
  items: StockTransferItem[]
}
