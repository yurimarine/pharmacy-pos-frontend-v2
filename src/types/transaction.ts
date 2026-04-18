export type TransactionStatus = 'completed' | 'voided'
export type PaymentMethod = 'cash'

export type Transaction = {
  id: string
  transaction_number: string
  pharmacy_id: string
  processed_by: string
  till_session_id: string | null
  status: TransactionStatus
  payment_method: PaymentMethod
  subtotal: number
  discount_amount: number
  total_amount: number
  amount_tendered: number
  change_amount: number
  notes: string | null
  voided_by: string | null
  voided_at: string | null
  void_reason: string | null
  created_at: string
  pharmacies?: { name: string } | null
  // Explicit FK alias names from Supabase joins
  users?: { name: string; role: string } | null
  voided_by_user?: { name: string } | null
  // For list view — count of items
  transaction_items?: { id: string }[]
}

export type TransactionItem = {
  id: string
  transaction_id: string
  product_id: string
  inventory_id: string
  product_name: string
  product_generic_name: string | null
  product_sku: string | null
  quantity: number
  unit_price: number
  discount_amount: number
  total_price: number
  created_at: string
}

export type TransactionWithItems = Omit<Transaction, 'transaction_items'> & {
  transaction_items: TransactionItem[]
}
