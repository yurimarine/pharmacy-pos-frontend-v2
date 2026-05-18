"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updatePharmacyInventory } from "@/app/admin/inventory/actions"
import type { PharmacyInventoryWithProduct } from "@/types/inventory"
import { computeSellingPrice, computeMarkupPercentage } from "@/types/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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

export default function EditInventoryModal({
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
  const [expiryDate, setExpiryDate] = useState<string>(
    inventory?.expiry_date ?? "",
  )
  const [threshold, setThreshold] = useState<string>(
    String(inventory?.low_stock_threshold ?? 10),
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
    const t = parseInt(threshold, 10)
    if (isNaN(sp) || sp < 0 || isNaN(mp) || mp < 0) {
      toast.error("Please enter valid non-negative values for pricing.")
      return
    }
    if (isNaN(t) || t < 0) {
      toast.error("Threshold must be a non-negative whole number.")
      return
    }

    startTransition(async () => {
      const result = await updatePharmacyInventory(inventory.id, {
        selling_price: sp,
        markup_percentage: mp,
        expiry_date: expiryDate.trim() || null,
        low_stock_threshold: t,
      })
      if (result.success) {
        toast.success("Inventory updated.")
        onOpenChange(false)
      } else {
        toast.error(result.error ?? "Failed to update inventory.")
      }
    })
  }

  if (!inventory) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Inventory</DialogTitle>
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
            <Label htmlFor="ei-markup">Markup %</Label>
            <Input
              id="ei-markup"
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
            <Label htmlFor="ei-price">Selling Price (₱)</Label>
            <Input
              id="ei-price"
              type="number"
              min={0}
              step={0.01}
              value={sellingPrice}
              onChange={(e) => handleSellingPriceChange(e.target.value)}
            />
          </div>

          {/* Expiry Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ei-expiry">Expiry date</Label>
            <Input
              id="ei-expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if this product has no expiry
            </p>
          </div>

          <Separator />

          {/* Current Quantity (read-only) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Current Quantity
            </Label>
            <div className="bg-muted px-3 py-2 rounded-md text-sm font-mono">
              {inventory.quantity} units
            </div>
          </div>

          {/* Low Stock Threshold */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ei-threshold">Low Stock Threshold</Label>
            <Input
              id="ei-threshold"
              type="number"
              min={0}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Alert shows when quantity falls at or below this number
            </p>
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
