"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { bulkUpdatePharmacyInventory } from "@/app/admin/inventory/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BulkEditModal({
  open,
  onOpenChange,
  selectedIds,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSuccess: () => void;
}) {
  const router = useRouter();

  const [markupPercentage, setMarkupPercentage] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [clearExpiry, setClearExpiry] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nothingFilled =
    markupPercentage === "" &&
    sellingPrice === "" &&
    lowStockThreshold === "" &&
    expiryDate === "" &&
    !clearExpiry;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setError(null);

    const payload: {
      markup_percentage?: number | null;
      selling_price?: number | null;
      low_stock_threshold?: number | null;
      expiry_date?: string | null;
    } = {};

    if (markupPercentage !== "") payload.markup_percentage = Number(markupPercentage);
    if (sellingPrice !== "") payload.selling_price = Number(sellingPrice);
    if (lowStockThreshold !== "") payload.low_stock_threshold = Number(lowStockThreshold);
    if (clearExpiry) {
      payload.expiry_date = null;
    } else if (expiryDate !== "") {
      payload.expiry_date = expiryDate;
    }

    bulkUpdatePharmacyInventory(selectedIds, payload)
      .then(result => {
        if (result?.error) {
          setError(result.error);
          setIsSubmitting(false);
          return;
        }
        toast.success(`${selectedIds.length} item${selectedIds.length !== 1 ? "s" : ""} updated.`);
        onSuccess();
        onOpenChange(false);
        router.refresh();
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to update items.");
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Bulk Edit</DialogTitle>
          <DialogDescription>
            Apply changes to {selectedIds.length} selected item
            {selectedIds.length !== 1 ? "s" : ""}. Leave a field blank to keep
            existing values.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="flex flex-col gap-4 py-2">
            {/* Markup */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="be-markup">Markup Percentage (%)</Label>
              <Input
                id="be-markup"
                type="number"
                min={0}
                step={0.1}
                placeholder="e.g. 20"
                value={markupPercentage}
                onChange={e => setMarkupPercentage(e.target.value)}
              />
            </div>

            {/* Selling price */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="be-price">Selling Price (₱)</Label>
              <Input
                id="be-price"
                type="number"
                min={0}
                step={0.01}
                placeholder="e.g. 150.00"
                value={sellingPrice}
                onChange={e => setSellingPrice(e.target.value)}
              />
            </div>

            {/* Low stock threshold */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="be-threshold">Low Stock Threshold</Label>
              <Input
                id="be-threshold"
                type="number"
                min={0}
                placeholder="e.g. 10"
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(e.target.value)}
              />
            </div>

            {/* Expiry date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="be-expiry">Expiry Date</Label>
              <Input
                id="be-expiry"
                type="date"
                value={expiryDate}
                onChange={e => {
                  setExpiryDate(e.target.value);
                  if (e.target.value) setClearExpiry(false);
                }}
                disabled={clearExpiry}
              />
              <div className="flex items-center gap-2 mt-0.5">
                <Checkbox
                  id="be-clear-expiry"
                  checked={clearExpiry}
                  onCheckedChange={checked => {
                    setClearExpiry(!!checked);
                    if (checked) setExpiryDate("");
                  }}
                />
                <Label htmlFor="be-clear-expiry" className="text-sm font-normal cursor-pointer">
                  Clear expiry date
                </Label>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || nothingFilled}
          >
            {isSubmitting
              ? "Applying…"
              : `Apply to ${selectedIds.length} item${selectedIds.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
