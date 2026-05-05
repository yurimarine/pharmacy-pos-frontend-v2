"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updatePharmacyInventoryPricing } from "@/app/admin/inventory/actions"
import type { PharmacyInventoryWithProduct } from "@/types/inventory"
import { computeSellingPrice, computeMarkupPercentage } from "@/types/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function EditPricingModal({
  open,
  onOpenChange,
  inventory,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventory: PharmacyInventoryWithProduct | null
}) {
  const unitCost = inventory?.product?.unit_cost ?? 0

  const [markup, setMarkup] = useState<string>(
    String(Math.round((inventory?.markup_percentage ?? 0) * 100) / 100),
  )
  const [sellingPrice, setSellingPrice] = useState<string>(
    String(Math.round((inventory?.selling_price ?? 0) * 100) / 100),
  )
  const [isPending, startTransition] = useTransition()

  const handleMarkupChange = (val: string) => {
    setMarkup(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0 && unitCost > 0) {
      setSellingPrice(String(Math.round(computeSellingPrice(unitCost, n) * 100) / 100))
    }
  }

  const handleSellingPriceChange = (val: string) => {
    setSellingPrice(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0 && unitCost > 0) {
      setMarkup(String(Math.round(computeMarkupPercentage(unitCost, n) * 100) / 100))
    }
  }

  const handleSubmit = () => {
    if (!inventory) return
    const sp = parseFloat(sellingPrice)
    const mp = parseFloat(markup)
    if (isNaN(sp) || sp < 0 || isNaN(mp) || mp < 0) {
      toast.error("Please enter valid non-negative values.")
      return
    }

    startTransition(async () => {
      const result = await updatePharmacyInventoryPricing(inventory.id, {
        selling_price: sp,
        markup_percentage: mp,
      })
      if (result.success) {
        toast.success("Pricing updated.")
        onOpenChange(false)
      } else {
        toast.error(result.error ?? "Failed to update pricing.")
      }
    })
  }

  if (!inventory) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Pricing</DialogTitle>
          <DialogDescription className="truncate">
            {inventory.product?.product_name ?? "Unknown product"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Unit Cost (read-only) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Unit Cost (reference)
            </Label>
            <div className="bg-muted px-3 py-2 rounded-md text-sm font-mono">
              {formatCurrency(unitCost)}
            </div>
          </div>

          {/* Markup % */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ep-markup">Markup %</Label>
            <Input
              id="ep-markup"
              type="number"
              min={0}
              step={0.1}
              value={markup}
              onChange={(e) => handleMarkupChange(e.target.value)}
              disabled={unitCost === 0}
            />
            {unitCost === 0 && (
              <p className="text-xs text-muted-foreground">
                Set unit cost on the product first to use markup
              </p>
            )}
          </div>

          {/* Selling Price */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ep-price">Selling Price (₱)</Label>
            <Input
              id="ep-price"
              type="number"
              min={0}
              step={0.01}
              value={sellingPrice}
              onChange={(e) => handleSellingPriceChange(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
