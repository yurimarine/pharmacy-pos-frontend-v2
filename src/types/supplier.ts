export type Supplier = {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export type SupplierInput = {
  name: string
  contact_person?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}
