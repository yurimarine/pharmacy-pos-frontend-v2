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
