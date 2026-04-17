'use client'

import { BanknoteIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type POSPaymentSectionProps = {
  totalAmount: number
  amountTendered: number
  changeAmount: number
}

export function POSPaymentSection({
  totalAmount,
  amountTendered,
  changeAmount,
}: POSPaymentSectionProps) {
  return (
    <div className="flex flex-col gap-3 py-3 border-t">
      {/* Payment method — cash only for now */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BanknoteIcon className="size-4" />
        <span>Cash payment</span>
      </div>

      {/* Tendered */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="amount-tendered" className="text-xs text-muted-foreground">
          Amount Tendered
        </Label>
        <Input
          id="amount-tendered"
          type="number"
          min={totalAmount}
          step={0.01}
          value={amountTendered || ''}
          readOnly
          className="text-right font-mono"
          placeholder={`₱${totalAmount.toFixed(2)}`}
        />
      </div>

      {/* Change */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Change</span>
        <span className={`font-semibold font-mono ${changeAmount < 0 ? 'text-destructive' : 'text-green-600'}`}>
          ₱{Math.max(0, changeAmount).toFixed(2)}
        </span>
      </div>
    </div>
  )
}
