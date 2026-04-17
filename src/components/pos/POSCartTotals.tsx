import { Separator } from '@/components/ui/separator'

type POSCartTotalsProps = {
  subtotal: number
  discountAmount: number
  totalAmount: number
}

export function POSCartTotals({
  subtotal,
  discountAmount,
  totalAmount,
}: POSCartTotalsProps) {
  return (
    <div className="flex flex-col gap-1.5 py-3 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span>₱{subtotal.toFixed(2)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount</span>
          <span>−₱{discountAmount.toFixed(2)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-semibold text-base">
        <span>Total</span>
        <span>₱{totalAmount.toFixed(2)}</span>
      </div>
    </div>
  )
}
