import type { StockStatus } from '@/types/inventory'

export function getStockStatus(
  quantity: number,
  threshold: number,
  expiryDate?: string | null
): StockStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (expiryDate) {
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)

    if (expiry < today) return 'expired'

    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilExpiry <= 60) return 'near_expiry'
  }

  if (quantity === 0) return 'out_of_stock'
  if (quantity <= threshold) return 'low_stock'
  return 'in_stock'
}

export const stockStatusConfig: Record<
  StockStatus,
  { label: string; variant: string; className?: string }
> = {
  in_stock: {
    label: 'In Stock',
    variant: 'default',
  },
  low_stock: {
    label: 'Low Stock',
    variant: 'outline',
    className: 'border-yellow-500 text-yellow-600 bg-yellow-50',
  },
  out_of_stock: {
    label: 'Out of Stock',
    variant: 'destructive',
  },
  near_expiry: {
    label: 'Near Expiry',
    variant: 'outline',
    className: 'border-orange-500 text-orange-600 bg-orange-50',
  },
  expired: {
    label: 'Expired',
    variant: 'destructive',
    className: 'bg-red-700 text-white',
  },
}
