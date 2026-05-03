export type WarehouseReceiptStatus = 'draft' | 'completed' | 'cancelled'

export const WR_STATUS_LABELS: Record<WarehouseReceiptStatus, string> = {
  draft: 'Draft',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export type WarehouseReceiptItem = {
  id: string
  receipt_id: string
  product_id: string
  po_item_id: string | null
  quantity_received: number
  unit_cost: number
  lot_number: string | null
  expiry_date: string | null
  notes: string | null
  products?: { product_name: string; sku: string | null } | null
}

export type WarehouseReceipt = {
  id: string
  receipt_number: string
  po_id: string | null
  supplier_id: string | null
  status: WarehouseReceiptStatus
  notes: string | null
  received_by: string
  received_at: string | null
  created_at: string
  updated_at: string
}

export type WarehouseReceiptWithItems = WarehouseReceipt & {
  supplier: { id: string; name: string } | null
  po: { id: string; po_number: string } | null
  received_by_user: { name: string; role: string } | null
  items: WarehouseReceiptItem[]
}
