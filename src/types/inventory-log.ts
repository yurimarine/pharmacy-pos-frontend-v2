export type InventoryLog = {
  id: string
  inventory_id: string
  product_id: string
  pharmacy_id: string
  changed_by: string
  change_type: string
  previous_quantity: number
  new_quantity: number
  reason: string
  created_at: string
  products?: { name: string } | null
  pharmacies?: { name: string } | null
  users?: { name: string } | null
}
