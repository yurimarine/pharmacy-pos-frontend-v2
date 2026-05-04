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

export type StockStatus =
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock'
  | 'near_expiry'
  | 'expired'

export type Inventory = {
  id: string
  product_id: string
  pharmacy_id: string
  quantity: number
  low_stock_threshold: number
  markup_percentage: number
  selling_price: number
  expiry_date: string | null
  last_restocked_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  products?: {
    name: string
    generic_name: string | null
    /** @deprecated removed in DB migration — use category_id + product_categories join */
    category?: string | null
    category_id: string | null
    type: string
    base_price: number
    requires_prescription: boolean
    product_categories?: { name: string } | null
  } | null
  pharmacies?: { name: string } | null
}

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
}
