'use client'

import { useState } from 'react'
import { usePOS } from '@/context/POSContext'
import type { Discount } from '@/types/discount'
import { toast } from 'sonner'
import { PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { CheckIcon, XIcon } from 'lucide-react'

type Props = {
  inventoryId: string
  currentDiscount: Discount | null
  onClose: () => void
}

export function ItemDiscountPopover({
  inventoryId,
  currentDiscount,
  onClose,
}: Props) {
  const { activeDiscounts, applyItemDiscount, setReference } = usePOS()

  const [pendingDiscount, setPendingDiscount] = useState<Discount | null>(null)
  const [refId, setRefId] = useState('')
  const [refName, setRefName] = useState('')

  const perItemDiscounts = activeDiscounts.filter((d) => d.scope === 'per_item')

  function handleDiscountSelect(discount: Discount) {
    if (discount.requires_reference) {
      setPendingDiscount(discount)
      return
    }
    applyItemDiscount(inventoryId, discount)
    onClose()
  }

  function handleRemoveDiscount() {
    applyItemDiscount(inventoryId, null)
    onClose()
  }

  function handleReferenceConfirm() {
    if (!refId.trim() || !refName.trim()) {
      toast.error('Please enter both ID number and name.')
      return
    }
    setReference(refId.trim(), refName.trim())
    applyItemDiscount(inventoryId, pendingDiscount!)
    setPendingDiscount(null)
    setRefId('')
    setRefName('')
    onClose()
  }

  return (
    <PopoverContent className="w-64 p-0" align="end">
      {pendingDiscount === null ? (
        <>
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Apply Discount
            </p>
          </div>

          {perItemDiscounts.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                No active per-item discounts available.
              </p>
            </div>
          ) : (
            <div>
              {perItemDiscounts.map((discount) => (
                <button
                  key={discount.id}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => handleDiscountSelect(discount)}
                >
                  <span>{discount.name}</span>
                  {currentDiscount?.id === discount.id ? (
                    <CheckIcon className="h-3.5 w-3.5 text-blue-600" />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {discount.type === 'percentage'
                        ? `${discount.value}%`
                        : `₱${discount.value.toFixed(2)}`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {currentDiscount !== null && (
            <>
              <Separator />
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                onClick={handleRemoveDiscount}
              >
                <XIcon className="h-3.5 w-3.5" />
                Remove discount
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-medium">
              {pendingDiscount.name} requires ID verification
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter the customer&apos;s ID details.
            </p>
          </div>

          <div className="px-3 py-3 space-y-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                ID Number
              </label>
              <Input
                className="h-8 text-sm"
                placeholder="e.g. PWD-12345678"
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Name on ID
              </label>
              <Input
                className="h-8 text-sm"
                placeholder="Full name"
                value={refName}
                onChange={(e) => setRefName(e.target.value)}
              />
            </div>
          </div>

          <div className="px-3 pb-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                setPendingDiscount(null)
                setRefId('')
                setRefName('')
              }}
            >
              Back
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleReferenceConfirm}
              disabled={!refId.trim() || !refName.trim()}
            >
              Apply
            </Button>
          </div>
        </>
      )}
    </PopoverContent>
  )
}
