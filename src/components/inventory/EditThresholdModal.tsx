"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { updateLowStockThreshold } from "@/app/admin/inventory/actions"
import type { PharmacyInventoryWithProduct } from "@/types/inventory"
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

export default function EditThresholdModal({
  open,
  onOpenChange,
  inventory,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventory: PharmacyInventoryWithProduct | null
}) {
  const [threshold, setThreshold] = useState<string>(
    String(inventory?.low_stock_threshold ?? 10),
  )
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!inventory) return
    const t = parseInt(threshold, 10)
    if (isNaN(t) || t < 0) {
      toast.error("Threshold must be a non-negative whole number.")
      return
    }

    startTransition(async () => {
      const result = await updateLowStockThreshold(inventory.id, t)
      if (result.success) {
        toast.success("Threshold updated.")
        onOpenChange(false)
      } else {
        toast.error(result.error ?? "Failed to update threshold.")
      }
    })
  }

  if (!inventory) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Edit Low Stock Threshold</DialogTitle>
          <DialogDescription className="truncate">
            {inventory.product?.product_name ?? "Unknown product"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Current Quantity (read-only) */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Current Quantity
            </Label>
            <div className="bg-muted px-3 py-2 rounded-md text-sm font-mono">
              {inventory.quantity} units
            </div>
          </div>

          {/* Threshold input */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="et-threshold">Low Stock Threshold</Label>
            <Input
              id="et-threshold"
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
