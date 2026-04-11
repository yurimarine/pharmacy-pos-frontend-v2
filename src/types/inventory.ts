export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export type Inventory = {
  id: string
  product_id: string
  pharmacy_id: string
  quantity: number
  low_stock_threshold: number
  markup_percentage: number
  selling_price: number
  is_active: boolean
  created_at: string
  updated_at: string
  products?: {
    name: string
    generic_name: string | null
    category: string | null
    type: string
    base_price: number
    requires_prescription: boolean
  } | null
  pharmacies?: { name: string } | null
}
