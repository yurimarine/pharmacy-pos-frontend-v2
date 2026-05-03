export type PurchaseOrderStatus =
  | 'draft'
  | 'submitted'
  | 'partially_received'
  | 'received'
  | 'cancelled'

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  partially_received: 'Partially Received',
  received: 'Received',
  cancelled: 'Cancelled',
}

export type PurchaseOrderItem = {
  id: string
  product_id: string
  quantity_ordered: number
  unit_cost: number
  notes: string | null
  products?: { product_name: string } | null
}

export type PurchaseOrder = {
  id: string
  po_number: string
  supplier_id: string | null
  status: PurchaseOrderStatus
  expected_delivery_date: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type PurchaseOrderWithItems = PurchaseOrder & {
  supplier: { id: string; name: string } | null
  created_by_user: { name: string; role: string } | null
  items: PurchaseOrderItem[]
}
