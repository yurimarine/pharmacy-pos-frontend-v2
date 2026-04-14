export type ProductClass = {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type ProductCategory = {
  id: string
  name: string
  description: string | null
  class_id: string
  created_at: string
  updated_at: string
  product_classes?: { name: string } | null
}

export type PackagingUnit = {
  id: string
  name: string
  abbreviation: string
  created_at: string
  updated_at: string
}

export type DispensingUnit = {
  id: string
  name: string
  abbreviation: string
  created_at: string
  updated_at: string
}
