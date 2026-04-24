'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateDiscount } from '@/app/admin/discounts/actions'
import {
  type Discount,
  type DiscountType,
  type DiscountScope,
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_SCOPE_LABELS,
} from '@/types/discount'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  discount: Discount | null
}

export function EditDiscountModal({ open, onOpenChange, discount }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<DiscountType>('percentage')
  const [value, setValue] = useState('')
  const [scope, setScope] = useState<DiscountScope>('per_item')
  const [requiresReference, setRequiresReference] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (discount) {
      setName(discount.name)
      setType(discount.type)
      setValue(String(discount.value))
      setScope(discount.scope)
      setRequiresReference(discount.requires_reference)
    }
  }, [discount])

  if (!discount) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      toast.error('Please enter a valid discount value.')
      return
    }
    if (type === 'percentage' && numValue > 100) {
      toast.error('Percentage cannot exceed 100%.')
      return
    }
    startTransition(async () => {
      try {
        await updateDiscount(discount!.id, {
          name: name.trim(),
          type,
          value: numValue,
          scope,
          requires_reference: requiresReference,
        })
        toast.success('Discount updated successfully.')
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-md">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Discount</DialogTitle>
          <DialogDescription>
            Update the details for this discount type.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          <form id="edit-discount-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Discount Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g. PWD, Senior Citizen, Promo May"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={type}
                onValueChange={(v: string | null) => v && setType(v as DiscountType)}
              >
                <SelectTrigger>
                  <SelectValue>{DISCOUNT_TYPE_LABELS[type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    {DISCOUNT_TYPE_LABELS.percentage}
                  </SelectItem>
                  <SelectItem value="fixed">
                    {DISCOUNT_TYPE_LABELS.fixed}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-value">
                {type === 'percentage' ? 'Percentage (%)' : 'Amount (₱)'}
              </Label>
              <Input
                id="edit-value"
                type="number"
                min={0.01}
                max={type === 'percentage' ? 100 : undefined}
                step={0.01}
                placeholder={type === 'percentage' ? '0–100' : '0.00'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                {type === 'percentage'
                  ? 'Enter a value between 1 and 100.'
                  : 'Enter a fixed peso amount.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Applies To</Label>
              <Select
                value={scope}
                onValueChange={(v: string | null) => v && setScope(v as DiscountScope)}
              >
                <SelectTrigger>
                  <SelectValue>{DISCOUNT_SCOPE_LABELS[scope]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_item">
                    {DISCOUNT_SCOPE_LABELS.per_item}
                  </SelectItem>
                  <SelectItem value="whole_cart">
                    {DISCOUNT_SCOPE_LABELS.whole_cart}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {scope === 'per_item'
                  ? 'Can be applied to individual cart items.'
                  : 'Applied to the entire transaction total.'}
              </p>
            </div>

            <div className="flex items-start justify-between gap-4 pt-1">
              <div className="space-y-1">
                <Label>Requires Reference ID</Label>
                <p className="text-sm text-muted-foreground">
                  Cashier must enter the customer&apos;s ID number and name when
                  applying this discount (e.g. PWD ID, Senior Citizen ID).
                </p>
              </div>
              <Switch
                checked={requiresReference}
                onCheckedChange={setRequiresReference}
              />
            </div>
          </form>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-discount-form" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
