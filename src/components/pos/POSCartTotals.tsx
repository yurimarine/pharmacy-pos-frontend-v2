'use client'

import { Separator } from "@/components/ui/separator";
import { usePOS } from "@/context/POSContext";

export function POSCartTotals() {
  const { subtotal, totalAmount, totalDiscountAmount, discountMode } = usePOS()

  const hasDiscount = totalDiscountAmount > 0

  return (
    <div className="flex flex-col gap-1.5 py-3 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span>₱{subtotal.toFixed(2)}</span>
      </div>
      {hasDiscount && (
        <div
          className={`flex justify-between ${discountMode === 'whole_cart' ? 'text-amber-600' : 'text-green-600'}`}
        >
          <span>Discount</span>
          <span>-₱{totalDiscountAmount.toFixed(2)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-semibold text-2xl">
        <span>Total</span>
        <span>₱{totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
