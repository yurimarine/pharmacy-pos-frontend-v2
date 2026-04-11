export type Pharmacy = {
  id: string
  name: string
  address: string | null
  owner: string | null
  created_at: string
  updated_at: string
}

export type PharmacyInput = {
  name: string
  address?: string | null
  owner?: string | null
}
