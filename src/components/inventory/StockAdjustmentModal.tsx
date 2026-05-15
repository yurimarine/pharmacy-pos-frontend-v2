"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { createStockAdjustment } from "@/app/admin/inventory/actions"
import type { PharmacyInventoryWithProduct, StockAdjustmentType, StockAdjustmentReason } from "@/types/inventory"
import { ADJUSTMENT_REASON_LABELS } from "@/types/inventory"
import { Button } from "@/components/ui/button"
import { QuantityInput } from "@/components/ui/QuantityInput"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function StockAdjustmentModal({
  open,
  onOpenChange,
  inventory,
  pharmacyId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventory: PharmacyInventoryWithProduct | null
  pharmacyId: string
}) {
  const [type, setType] = useState<StockAdjustmentType>("increase")
  const [quantity, setQuantity] = useState<string>("1")
  const [reason, setReason] = useState<StockAdjustmentReason | "">("")
  const [notes, setNotes] = useState<string>("")
  const [isPending, startTransition] = useTransition()

  const currentQty = inventory?.quantity ?? 0
  const qty = Math.max(0, parseInt(quantity, 10) || 0)
  const newTotal = type === "increase" ? currentQty + qty : currentQty - qty
  const wouldGoNegative = type === "decrease" && newTotal < 0

  const handleSubmit = () => {
    if (!inventory) return
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0.")
      return
    }
    if (!reason) {
      toast.error("Please select a reason.")
      return
    }
    if (reason === "other" && !notes.trim()) {
      toast.error("Notes are required when reason is 'Other'.")
      return
    }
    if (wouldGoNegative) return

    startTransition(async () => {
      const result = await createStockAdjustment({
        pharmacy_id: pharmacyId,
        product_id: inventory.product_id,
        type,
        quantity: qty,
        reason: reason as StockAdjustmentReason,
        notes: notes.trim() || null,
      })
      if (result.success) {
        toast.success("Stock adjusted successfully.")
        onOpenChange(false)
      } else {
        toast.error(result.error ?? "Failed to adjust stock.")
      }
    })
  }

  if (!inventory) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription className="truncate">
            {inventory.product?.product_name ?? "Unknown product"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Current stock display */}
          <div className="text-center py-2 rounded-md bg-muted">
            <p className="text-xs text-muted-foreground mb-0.5">Current Stock</p>
            <p className="text-2xl font-bold">{currentQty} units</p>
          </div>

          {/* Type toggle */}
          <div className="flex flex-col gap-1.5">
            <Label>Adjustment Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "increase" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setType("increase")}
              >
                + Increase
              </Button>
              <Button
                type="button"
                variant={type === "decrease" ? "default" : "outline"}
                className={`flex-1 ${type === "decrease" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
                onClick={() => setType("decrease")}
              >
                − Decrease
              </Button>
            </div>
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sa-qty">Quantity</Label>
            <QuantityInput
              id="sa-qty"
              value={qty}
              onChange={(v) => setQuantity(String(v))}
              min={1}
            />
            {qty > 0 && (
              <p
                className={`text-xs font-medium ${
                  wouldGoNegative
                    ? "text-destructive"
                    : type === "increase"
                      ? "text-green-600"
                      : "text-muted-foreground"
                }`}
              >
                {wouldGoNegative
                  ? `Cannot decrease by more than ${currentQty} units`
                  : `New total: ${newTotal} units`}
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sa-reason">Reason</Label>
            <Select
              value={reason}
              onValueChange={(v) =>
                v !== null && setReason(v as StockAdjustmentReason)
              }
            >
              <SelectTrigger id="sa-reason">
                <SelectValue>
                  {reason
                    ? ADJUSTMENT_REASON_LABELS[reason as StockAdjustmentReason]
                    : "Select reason…"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(ADJUSTMENT_REASON_LABELS) as [
                    StockAdjustmentReason,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sa-notes">
              Notes{reason === "other" ? " *" : ""}
            </Label>
            <Textarea
              id="sa-notes"
              placeholder="Optional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {reason === "other" && (
              <p className="text-xs text-muted-foreground">
                Required for &lsquo;Other&rsquo; reason
              </p>
            )}
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
          <Button
            onClick={handleSubmit}
            disabled={isPending || wouldGoNegative || !reason || qty <= 0}
          >
            {isPending ? "Adjusting…" : "Adjust Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
