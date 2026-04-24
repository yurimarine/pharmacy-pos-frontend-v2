export type DiscountType = 'percentage' | 'fixed'

export type DiscountScope = 'per_item' | 'whole_cart'

export type Discount = {
  id: string
  name: string
  type: DiscountType
  value: number
  scope: DiscountScope
  requires_reference: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage (%)',
  fixed: 'Fixed Amount (₱)',
}

export const DISCOUNT_SCOPE_LABELS: Record<DiscountScope, string> = {
  per_item: 'Per Item',
  whole_cart: 'Whole Cart',
}

export function computeDiscountAmount(
  discount: Discount,
  baseAmount: number,
): number {
  if (discount.type === 'percentage') {
    return parseFloat(((discount.value / 100) * baseAmount).toFixed(2))
  }
  return parseFloat(Math.min(discount.value, baseAmount).toFixed(2))
}

export function formatDiscountLabel(discount: Discount): string {
  if (discount.type === 'percentage') {
    return `${discount.name} · ${discount.value}%`
  }
  return `${discount.name} · ₱${discount.value.toFixed(2)}`
}
