"use client"

import { useState, useEffect } from "react"
import { CheckIcon } from "lucide-react"
import {
  getMissingProductsCount,
  initializePharmacyInventory,
} from "@/app/admin/inventory/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QuantityInput } from "@/components/ui/QuantityInput"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Result = {
  added: number
  skipped: { id: string; name: string }[]
}

export default function InitializeInventoryModal({
  open,
  onOpenChange,
  pharmacyId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pharmacyId: string
}) {
  const [missingCount, setMissingCount] = useState<number | null>(null)
  const [isLoadingCount, setIsLoadingCount] = useState(false)

  const [quantity, setQuantity] = useState(0)
  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const [markupPercentage, setMarkupPercentage] = useState(0)
  const [expiryDate, setExpiryDate] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    if (!open) return
    setIsLoadingCount(true)
    setResult(null)
    getMissingProductsCount(pharmacyId)
      .then((count) => setMissingCount(count))
      .catch(() => setMissingCount(0))
      .finally(() => setIsLoadingCount(false))
  }, [open, pharmacyId])

  const handleSubmit = () => {
    setIsSubmitting(true)
    initializePharmacyInventory(pharmacyId, {
      quantity,
      low_stock_threshold: lowStockThreshold,
      markup_percentage: markupPercentage,
      expiry_date: expiryDate.trim() || null,
    })
      .then((res) => setResult(res))
      .catch((err) =>
        setResult({
          added: 0,
          skipped: [{ id: "error", name: err instanceof Error ? err.message : "An error occurred" }],
        }),
      )
      .finally(() => setIsSubmitting(false))
  }

  const nothingToInit = missingCount === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-md">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Initialize Pharmacy Inventory</DialogTitle>
          <DialogDescription>
            Create inventory records for all products not yet stocked at this pharmacy.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {result ? (
            /* ── Result view ── */
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckIcon className="size-4 text-green-600 shrink-0" />
                <span>{result.added} product{result.added !== 1 ? "s" : ""} added to inventory.</span>
              </div>

              {result.skipped.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    {result.skipped.length} product{result.skipped.length !== 1 ? "s were" : " was"} skipped (no unit cost set):
                  </p>
                  <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-md border bg-muted/40 px-3 py-2">
                    {result.skipped.map((p) => (
                      <li key={p.id} className="text-xs text-muted-foreground">
                        {p.name}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Set a unit cost on these products first, then run Initialize again.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ── Form view ── */
            <div className="flex flex-col gap-4 py-2">
              {/* Count summary */}
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {isLoadingCount ? (
                  <Skeleton className="h-4 w-48" />
                ) : nothingToInit ? (
                  <span className="text-muted-foreground">
                    All products are already stocked. Nothing to initialize.
                  </span>
                ) : (
                  <span>
                    <span className="font-medium">{missingCount}</span>{" "}
                    product{missingCount !== 1 ? "s" : ""} will be added to this pharmacy&apos;s inventory.
                  </span>
                )}
              </div>

              {/* Default Quantity */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ii-quantity">Default Quantity</Label>
                <QuantityInput
                  value={quantity}
                  onChange={setQuantity}
                  min={0}
                  disabled={nothingToInit}
                />
              </div>

              {/* Low Stock Threshold */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ii-threshold">Default Low Stock Threshold</Label>
                <Input
                  id="ii-threshold"
                  type="number"
                  min={0}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={nothingToInit}
                />
              </div>

              {/* Markup % */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ii-markup">Default Markup %</Label>
                <Input
                  id="ii-markup"
                  type="number"
                  min={0}
                  step={0.1}
                  value={markupPercentage}
                  onChange={(e) => setMarkupPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                  disabled={nothingToInit}
                />
              </div>

              {/* Expiry Date */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ii-expiry">Expiry Date</Label>
                <Input
                  id="ii-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  disabled={nothingToInit}
                />
                <p className="text-xs text-muted-foreground">Leave blank if not applicable</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          {result ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoadingCount || nothingToInit}
              >
                {isSubmitting ? "Initializing…" : "Initialize"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
