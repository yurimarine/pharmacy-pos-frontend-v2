import type { StockStatus } from '@/types/inventory'

export function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity === 0) return 'out_of_stock'
  if (quantity <= threshold) return 'low_stock'
  return 'in_stock'
}

export const stockStatusConfig = {
  in_stock: { label: 'In Stock', variant: 'default' },
  low_stock: { label: 'Low Stock', variant: 'warning' },
  out_of_stock: { label: 'Out of Stock', variant: 'destructive' },
} as const
