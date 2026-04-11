export type ProductType = 'branded' | 'generic'

export type Product = {
  id: string
  name: string
  generic_name: string | null
  category: string | null
  type: ProductType
  base_price: number
  requires_prescription: boolean
  supplier_id: string | null
  manufacturer_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  suppliers?: { name: string } | null
  manufacturers?: { name: string } | null
}
