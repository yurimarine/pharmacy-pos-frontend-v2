'use client'

import { useState, useEffect } from 'react'
import { usePOS } from '@/context/POSContext'
import type { Discount } from '@/types/discount'
import { toast } from 'sonner'
import { PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { CheckIcon, XIcon } from 'lucide-react'

type Props = {
  onClose: () => void
}

export function CartDiscountPopover({ onClose }: Props) {
  const {
    activeDiscounts,
    cartDiscount,
    setCartDiscount,
    setReference,
    referenceId,
    referenceName,
  } = usePOS()

  const [pendingDiscount, setPendingDiscount] = useState<Discount | null>(null)
  const [refId, setRefId] = useState('')
  const [refName, setRefName] = useState('')

  // Pre-fill reference fields if cart discount already requires reference
  useEffect(() => {
    if (cartDiscount?.requires_reference) {
      setRefId(referenceId)
      setRefName(referenceName)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const wholeCartDiscounts = activeDiscounts.filter((d) => d.scope === 'whole_cart')

  function handleDiscountSelect(discount: Discount) {
    if (discount.requires_reference) {
      setPendingDiscount(discount)
      return
    }
    try {
      setCartDiscount(discount)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply discount.')
    }
  }

  function handleRemoveDiscount() {
    setCartDiscount(null)
    onClose()
  }

  function handleReferenceConfirm() {
    if (!refId.trim() || !refName.trim()) {
      toast.error('Please enter both ID number and name.')
      return
    }
    try {
      setReference(refId.trim(), refName.trim())
      setCartDiscount(pendingDiscount!)
      setPendingDiscount(null)
      setRefId('')
      setRefName('')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply discount.')
    }
  }

  return (
    <PopoverContent className="w-64 p-0" align="start">
      {pendingDiscount === null ? (
        <>
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cart Discount
            </p>
          </div>

          {wholeCartDiscounts.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                No active cart discounts available.
              </p>
            </div>
          ) : (
            <div>
              {wholeCartDiscounts.map((discount) => (
                <button
                  key={discount.id}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => handleDiscountSelect(discount)}
                >
                  <span>{discount.name}</span>
                  {cartDiscount?.id === discount.id ? (
                    <CheckIcon className="h-3.5 w-3.5 text-amber-600" />
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

          {cartDiscount !== null && (
            <>
              <Separator />
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                onClick={handleRemoveDiscount}
              >
                <XIcon className="h-3.5 w-3.5" />
                Remove cart discount
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
