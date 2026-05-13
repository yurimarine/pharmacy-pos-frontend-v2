import type { DiscountType, DiscountScope } from '@/types/discount'

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
  subtotal: number | null
  discount_id: string | null
  discount_amount: number
  reference_id: string | null
  reference_name: string | null
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
  unit_cost: number | null
  discount_id: string | null
  discount_amount: number
  total_price: number
  created_at: string
}

export type TransactionWithItems = Omit<Transaction, 'transaction_items'> & {
  transaction_items: TransactionItem[]
}

// ── Discount-joined types for detail views ────────────────────────────────────

export type TransactionItemWithDiscount = TransactionItem & {
  item_discount: {
    id: string
    name: string
    type: DiscountType
    value: number
    scope: DiscountScope
  } | null
}

export type TransactionWithDiscount = Transaction & {
  transaction_discount: {
    id: string
    name: string
    type: DiscountType
    value: number
    scope: DiscountScope
    requires_reference: boolean
  } | null
}

export type TransactionWithDetails = Omit<Transaction, 'transaction_items'> & {
  transaction_discount: {
    id: string
    name: string
    type: DiscountType
    value: number
    scope: DiscountScope
    requires_reference: boolean
  } | null
  transaction_items: TransactionItemWithDiscount[]
}
