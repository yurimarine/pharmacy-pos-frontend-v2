// ── Stock Status ──────────────────────────────────────────────────────────────

export type StockStatus =
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'near_expiry'
  | 'expired'

// ── Pharmacy Inventory ────────────────────────────────────────────────────────

export type PharmacyInventory = {
  id: string
  product_id: string
  pharmacy_id: string
  quantity: number
  selling_price: number
  markup_percentage: number
  low_stock_threshold: number
  expiry_date: string | null
  last_restocked_at: string | null
  created_at: string
  updated_at: string
}

export type PharmacyInventoryWithProduct = PharmacyInventory & {
  product: {
    id: string
    product_name: string
    generic_name: string | null
    sku: string | null
    packaging_type: string
    unit_count: number
    requires_prescription: boolean
    unit_cost: number
  } | null
}

// ── Stock Adjustments ─────────────────────────────────────────────────────────

export type StockAdjustmentType = "increase" | "decrease"
export type StockAdjustmentReason =
  | "damaged"
  | "expired"
  | "lost"
  | "count_correction"
  | "other"

export const ADJUSTMENT_REASON_LABELS: Record<StockAdjustmentReason, string> = {
  damaged: "Damaged",
  expired: "Expired",
  lost: "Lost",
  count_correction: "Count Correction",
  other: "Other",
}

export type StockAdjustment = {
  id: string
  pharmacy_id: string
  product_id: string
  adjusted_by: string
  type: StockAdjustmentType
  quantity: number
  reason: StockAdjustmentReason
  notes: string | null
  created_at: string
  adjusted_by_user: { name: string; role: string } | null
  product: { product_name: string; sku: string | null } | null
}

// ── POS Inventory (snake_case admin version — used by admin getPOSInventory) ──
// Note: POSContext.tsx defines its own camelCase POSInventoryItem for POS components.

export type POSInventoryItem = {
  inventory_id: string
  product_id: string
  product_name: string
  generic_name: string | null
  sku: string | null
  packaging_type: string
  unit_count: number
  requires_prescription: boolean
  quantity: number
  selling_price: number
  expiry_date: string | null
  low_stock_threshold: number
}

// ── POS Inventory Table Item (old camelCase shape for pos-terminal/inventory view) ──

export type POSInventoryTableItem = {
  id: string
  productId: string
  productName: string
  productGenericName: string | null
  productSku: string | null
  category: string | null
  requiresPrescription: boolean
  packagingLabel: string | null
  dispensingUnit: string | null
  quantity: number
  sellingPrice: number
  lowStockThreshold: number
  expiryDate: string | null
  lastRestockedAt: string | null
}

// ── Inventory Logs ────────────────────────────────────────────────────────────

export type InventoryLogEntityType = "warehouse" | "pharmacy"
export type InventoryLogAction =
  | "received"
  | "transferred_out"
  | "transferred_in"
  | "adjusted"
  | "sold"
  | "voided"
export type InventoryLogReferenceType = "receipt" | "transfer" | "adjustment"

export type InventoryLog = {
  id: string
  entity_type: InventoryLogEntityType
  entity_id: string
  action: InventoryLogAction
  quantity_before: number
  quantity_after: number
  quantity_change: number
  reference_type: InventoryLogReferenceType | null
  reference_id: string | null
  performed_by: string
  notes: string | null
  created_at: string
}

export type InventoryLogWithDetails = InventoryLog & {
  performed_by_user: { name: string; role: string } | null
}

// ── Warehouse Inventory ───────────────────────────────────────────────────────

export type WarehouseInventory = {
  id: string
  product_id: string
  receipt_item_id: string
  lot_number: string | null
  expiry_date: string | null
  quantity_remaining: number
  unit_cost: number
  created_at: string
  updated_at: string
}

export type WarehouseInventoryWithProduct = WarehouseInventory & {
  product: {
    id: string
    product_name: string
    generic_name: string | null
    sku: string | null
    packaging_type: string
    unit_count: number
    requires_prescription: boolean
    unit_cost: number
  } | null
  receipt_item: {
    receipt: {
      id: string
      receipt_number: string
      received_at: string | null
    }
  } | null
}

// ── Purchase Orders ───────────────────────────────────────────────────────────

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

// ── Warehouse Receipts ────────────────────────────────────────────────────────

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

// ── Stock Transfers ───────────────────────────────────────────────────────────

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
