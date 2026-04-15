"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  finalizeBatch,
  getPriceChangePreview,
  type PriceChangePreviewItem,
} from "@/app/admin/batches/actions";
import type { BatchWithItems } from "@/types/batch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, CheckCircleIcon, LoaderIcon } from "lucide-react";

const BATCH_TYPE_LABELS: Record<string, string> = {
  stock_in: "Stock In",
  stock_out: "Stock Out",
  markup_change: "Markup Change",
  base_price_change: "Base Price Change",
};

type FinalizeBatchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: BatchWithItems;
};

export function FinalizeBatchDialog({
  open,
  onOpenChange,
  batch,
}: FinalizeBatchDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [priceChanges, setPriceChanges] = useState<PriceChangePreviewItem[] | null>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  const handleOpenChange = (val: boolean) => {
    if (!isPending) {
      if (!val) {
        setPriceChanges(null);
        setPreviewLoaded(false);
      }
      onOpenChange(val);
    }
  };

  const loadPreview = async () => {
    if (previewLoaded) return;
    setIsLoadingPreview(true);
    try {
      const changes = await getPriceChangePreview(batch.id);
      setPriceChanges(changes);
      setPreviewLoaded(true);
    } catch (err) {
      console.error("Preview error:", err);
      toast.error("Failed to load price preview.");
      setPreviewLoaded(true);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDialogOpen = (val: boolean) => {
    handleOpenChange(val);
    if (val && batch.type === "stock_in") {
      loadPreview();
    } else if (val) {
      setPreviewLoaded(true);
    }
  };

  const handleFinalize = () => {
    startTransition(async () => {
      try {
        const result = await finalizeBatch(batch.id);
        if (result.priceChanges.length > 0) {
          toast.success(
            `Batch finalized. ${result.priceChanges.length} price change(s) applied.`,
          );
        } else {
          toast.success("Batch finalized successfully.");
        }
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to finalize batch.",
        );
      }
    });
  };

  const totalItems = batch.batch_items?.length ?? 0;
  const totalQty =
    batch.batch_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const isPriceRelated =
    batch.type === "markup_change" || batch.type === "base_price_change";

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Finalize Batch</DialogTitle>
          <DialogDescription>
            Review the summary below before finalizing{" "}
            <span className="font-medium text-foreground">
              {batch.batch_number}
            </span>
            . This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Summary */}
          <div className="rounded-lg border p-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">
                {BATCH_TYPE_LABELS[batch.type] ?? batch.type}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            {!isPriceRelated && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Quantity</span>
                <span className="font-medium">{totalQty}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pharmacy</span>
              <span className="font-medium">
                {batch.type === "base_price_change"
                  ? "All pharmacies"
                  : (batch.pharmacy?.name ?? "—")}
              </span>
            </div>
          </div>

          {/* Price changes detected on stock_in */}
          {batch.type === "stock_in" && (
            <div className="flex flex-col gap-2">
              {isLoadingPreview ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderIcon className="size-4 animate-spin" />
                  Checking for price changes…
                </div>
              ) : priceChanges && priceChanges.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangleIcon className="size-4 shrink-0" />
                    <span className="text-sm font-medium">
                      {priceChanges.length} price change
                      {priceChanges.length > 1 ? "s" : ""} detected
                    </span>
                  </div>
                  <p className="text-xs text-amber-700">
                    The following product base prices will be updated across all
                    pharmacies:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {priceChanges.map((change, i) => {
                      if (change.type === "base_price_change") {
                        return (
                          <div key={i} className="text-xs text-amber-800">
                            <span className="font-medium">{change.productName}</span>
                            {" — "}₱{change.oldBasePrice.toFixed(2)} → ₱
                            {change.newBasePrice.toFixed(2)}
                            {change.affectedPharmaciesCount > 1 && (
                              <span className="text-amber-600">
                                {" "}
                                ({change.affectedPharmaciesCount} pharmacies)
                              </span>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ) : previewLoaded ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircleIcon className="size-4 text-green-600" />
                  No price changes detected.
                </div>
              ) : null}
            </div>
          )}

          {/* Markup change summary */}
          {batch.type === "markup_change" && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="size-4 shrink-0 mt-0.5" />
                <span>
                  Finalizing will update the markup percentage for{" "}
                  {totalItems} product{totalItems !== 1 ? "s" : ""} at{" "}
                  <span className="font-medium">
                    {batch.pharmacy?.name ?? "this pharmacy"}
                  </span>
                  . Selling prices will be recalculated automatically.
                </span>
              </div>
            </div>
          )}

          {/* Base price change summary */}
          {batch.type === "base_price_change" && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="size-4 shrink-0 mt-0.5" />
                <span>
                  Finalizing will update the base price for {totalItems} product
                  {totalItems !== 1 ? "s" : ""} globally. Selling prices across
                  all pharmacies will be recalculated based on existing markup
                  percentages.
                </span>
              </div>
            </div>
          )}

          {/* Stock out warning */}
          {batch.type === "stock_out" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="size-4 shrink-0 mt-0.5" />
                <span>
                  Finalizing will deduct the specified quantities from
                  inventory. Ensure stock levels are correct before proceeding.
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleFinalize} disabled={isPending}>
            {isPending ? "Finalizing…" : "Finalize Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
