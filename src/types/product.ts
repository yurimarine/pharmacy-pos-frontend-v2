export type ProductType = 'branded' | 'generic' | 'na'
export type ProductStatus = 'active' | 'inactive' | 'discontinued'

export type Product = {
  id: string
  name: string
  generic_name: string | null
  sku: string | null
  barcode: string | null
  class_id: string | null
  category_id: string | null
  /** @deprecated removed in DB migration — use category_id + product_categories join */
  category?: string | null
  type: ProductType
  base_price: number
  requires_prescription: boolean
  supplier_id: string | null
  manufacturer_id: string | null
  packaging_unit_id: string | null
  unit_count: number
  dispensing_unit_id: string | null
  status: ProductStatus
  created_at: string
  updated_at: string
  suppliers?: { name: string } | null
  manufacturers?: { name: string } | null
  product_classes?: { name: string } | null
  product_categories?: { name: string } | null
  packaging_units?: { name: string; abbreviation: string } | null
  dispensing_units?: { name: string; abbreviation: string } | null
}
