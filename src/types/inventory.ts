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
