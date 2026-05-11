"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateRestockPO } from "@/app/admin/purchase-orders/actions";
import { getInventoryStats } from "@/app/admin/inventory/actions";
import { getSuppliers } from "@/app/admin/suppliers/actions";
import type { Supplier } from "@/types/supplier";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GenerateRestockPOModal({
  open,
  onOpenChange,
  pharmacyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pharmacyId: string;
}) {
  const router = useRouter();

  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [defaultQuantity, setDefaultQuantity] = useState(50);
  const [supplierId, setSupplierId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setIsLoadingCount(true);
    setError(null);

    Promise.all([getInventoryStats(pharmacyId), getSuppliers()])
      .then(([stats, supplierList]) => {
        setLowStockCount(stats.lowStock + stats.outOfStock);
        setSuppliers(supplierList);
      })
      .catch(() => setLowStockCount(0))
      .finally(() => setIsLoadingCount(false));
  }, [open, pharmacyId]);

  const nothingToRestock = lowStockCount === 0;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setError(null);
    generateRestockPO(pharmacyId, defaultQuantity, supplierId || null)
      .then(result => {
        router.push(`/admin/purchase-orders/${result.id}/edit`);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to generate PO.");
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Generate Restock PO</DialogTitle>
          <DialogDescription>
            Create a draft Purchase Order from all low stock and out-of-stock
            items.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="flex flex-col gap-4 py-2">
            {/* Count summary */}
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              {isLoadingCount ? (
                <Skeleton className="h-4 w-52" />
              ) : nothingToRestock ? (
                <span className="text-muted-foreground">
                  No low stock items found. All products are sufficiently
                  stocked.
                </span>
              ) : (
                <span>
                  <span className="font-medium">{lowStockCount}</span>{" "}
                  low/out-of-stock item{lowStockCount !== 1 ? "s" : ""} will be
                  added to this PO.
                </span>
              )}
            </div>

            {/* Default Order Quantity */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rpo-qty">Default Order Quantity</Label>
              <Input
                id="rpo-qty"
                type="number"
                min={1}
                value={defaultQuantity}
                onChange={e =>
                  setDefaultQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                disabled={nothingToRestock}
              />
              <p className="text-xs text-muted-foreground">
                Applied to every item in the PO
              </p>
            </div>

            {/* Supplier */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rpo-supplier">Supplier</Label>
              <Select
                value={supplierId}
                onValueChange={v => v !== null && setSupplierId(v)}
                disabled={nothingToRestock}
              >
                <SelectTrigger id="rpo-supplier">
                  <SelectValue>
                    {supplierId
                      ? (suppliers.find(s => s.id === supplierId)?.name ??
                        "No supplier")
                      : "No supplier"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No supplier</SelectItem>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error */}
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
            disabled={isSubmitting || isLoadingCount || nothingToRestock}
          >
            {isSubmitting ? "Generating…" : "Generate PO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
