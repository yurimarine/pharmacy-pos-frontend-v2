import type { StockStatus } from '@/types/inventory'

export type CartItem = {
  inventoryId: string
  productId: string
  productName: string
  productGenericName: string | null
  productSku: string | null
  requiresPrescription: boolean
  quantity: number
  unitPrice: number
  totalPrice: number
  maxQuantity: number      // current stock level — hard cap
  stockStatus: StockStatus
}

export type Cart = {
  items: CartItem[]
  subtotal: number
  discountAmount: number
  totalAmount: number
}
