"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { SearchIcon, XIcon } from "lucide-react";
import { addBatchItem } from "@/app/admin/batches/actions";
import type { BatchWithItems, BatchItem, StockOutReason } from "@/types/batch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  generic_name: string | null;
  base_price: number;
  current_quantity?: number;
  current_markup?: number;
  current_selling_price?: number;
};

type BulkAddBatchItemsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: BatchWithItems;
  products: ProductOption[];
  onAllAdded: (items: BatchItem[]) => void;
};

const STOCK_OUT_REASONS: { value: StockOutReason; label: string }[] = [
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "returned", label: "Returned" },
  { value: "adjustment", label: "Adjustment" },
  { value: "transferred", label: "Transferred" },
];

export function BulkAddBatchItemsDialog({
  open,
  onOpenChange,
  batch,
  products,
  onAllAdded,
}: BulkAddBatchItemsDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sharedMarkup, setSharedMarkup] = useState("");
  const [sharedPrice, setSharedPrice] = useState("");
  const [sharedUnitCost, setSharedUnitCost] = useState("");
  const [sharedReason, setSharedReason] = useState<StockOutReason | "">("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const isMarkup = batch.type === "markup_change";
  const isBasePrice = batch.type === "base_price_change";
  const isStockIn = batch.type === "stock_in";
  const isStockOut = batch.type === "stock_out";

  const filtered = products.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.generic_name?.toLowerCase().includes(q) ?? false)
    );
  });

  const resetState = () => {
    setSearch("");
    setSelectedIds(new Set());
    setSharedMarkup("");
    setSharedPrice("");
    setSharedUnitCost("");
    setSharedReason("");
    setQuantities({});
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetState();
    onOpenChange(val);
  };

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setQuantities(q => {
          const copy = { ...q };
          delete copy[id];
          return copy;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filtered.forEach(p => next.add(p.id));
      return next;
    });
  };

  const isSharedValueValid = (): boolean => {
    const selected = products.filter(p => selectedIds.has(p.id));

    if (isMarkup) {
      return sharedMarkup.trim() !== "" && parseFloat(sharedMarkup) >= 0;
    }
    if (isBasePrice) {
      return sharedPrice.trim() !== "" && parseFloat(sharedPrice) >= 0;
    }
    if (isStockIn) {
      return selected.every(p => {
        const q = quantities[p.id];
        return q !== undefined && q.trim() !== "" && parseInt(q) >= 1;
      });
    }
    // stock_out
    if (sharedReason === "") return false;
    return selected.every(p => {
      const q = quantities[p.id];
      if (!q || q.trim() === "" || parseInt(q) < 1) return false;
      if (p.current_quantity !== undefined && parseInt(q) > p.current_quantity)
        return false;
      return true;
    });
  };

  const handleBulkAdd = () => {
    startTransition(async () => {
      const selectedProducts = products.filter(p => selectedIds.has(p.id));
      const addedItems: BatchItem[] = [];
      const errors: string[] = [];

      for (const product of selectedProducts) {
        try {
          let data: Parameters<typeof addBatchItem>[0];

          if (isMarkup) {
            data = {
              batch_id: batch.id,
              product_id: product.id,
              quantity: 1,
              unit_cost: parseFloat(sharedMarkup),
            };
          } else if (isBasePrice) {
            data = {
              batch_id: batch.id,
              product_id: product.id,
              quantity: 1,
              unit_cost: parseFloat(sharedPrice),
            };
          } else if (isStockIn) {
            const qty = parseInt(quantities[product.id] ?? "0");
            const cost = sharedUnitCost.trim()
              ? parseFloat(sharedUnitCost)
              : product.base_price;
            data = {
              batch_id: batch.id,
              product_id: product.id,
              quantity: qty,
              unit_cost: cost,
            };
          } else {
            const qty = parseInt(quantities[product.id] ?? "0");
            data = {
              batch_id: batch.id,
              product_id: product.id,
              quantity: qty,
              reason: sharedReason as StockOutReason,
            };
          }

          const item = await addBatchItem(data);
          addedItems.push(item);
        } catch (err) {
          errors.push(
            `${product.name}: ${err instanceof Error ? err.message : "Failed"}`,
          );
        }
      }

      if (addedItems.length > 0) {
        onAllAdded(addedItems);
        toast.success(
          `${addedItems.length} item${addedItems.length !== 1 ? "s" : ""} added to batch.`,
        );
      }

      if (errors.length > 0) {
        errors.forEach(e => toast.error(e));
      }

      if (errors.length === 0) {
        onOpenChange(false);
        resetState();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex flex-col w-screen h-screen max-w-none max-h-none rounded-none p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <DialogTitle>Bulk Add Items</DialogTitle>
            <DialogDescription>
              Select products to add to this batch.
              {selectedIds.size > 0 && ` ${selectedIds.size} selected.`}
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b flex items-center gap-3 shrink-0">
          <div className="relative flex-1 max-w-sm flex items-center">
            <SearchIcon className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search products by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-8"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 size-7"
                onClick={() => setSearch("")}
              >
                <XIcon className="size-3.5" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          {selectedIds.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
          )}
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No products found.
            </div>
          ) : (
            filtered.map(product => {
              const isSelected = selectedIds.has(product.id);
              const qty = quantities[product.id] ?? "";
              const qtyNum = parseInt(qty);
              const exceedsStock =
                isStockOut &&
                product.current_quantity !== undefined &&
                qty !== "" &&
                !isNaN(qtyNum) &&
                qtyNum > product.current_quantity;

              return (
                <div
                  key={product.id}
                  className={cn(
                    "flex items-center gap-4 px-6 py-3 border-b",
                    "hover:bg-muted/50 transition-colors cursor-pointer",
                    isSelected && "bg-muted/30",
                  )}
                  onClick={() => toggleProduct(product.id)}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleProduct(product.id)}
                    onClick={e => e.stopPropagation()}
                  />

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {product.name}
                    </p>
                    {product.generic_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {product.generic_name}
                      </p>
                    )}
                  </div>

                  {/* Right: context info + optional quantity input */}
                  <div
                    className="flex items-center gap-3 shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    {isMarkup && (
                      <span className="text-xs text-muted-foreground">
                        Current: {product.current_markup ?? 0}%
                      </span>
                    )}
                    {isBasePrice && (
                      <span className="text-xs text-muted-foreground">
                        Current: ₱{Number(product.base_price).toFixed(2)}
                      </span>
                    )}
                    {isStockIn && (
                      <>
                        <span className="text-xs text-muted-foreground">
                          Base price: ₱{Number(product.base_price).toFixed(2)}
                        </span>
                        {isSelected && (
                          <Input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            className="w-20 h-7 text-sm"
                            value={qty}
                            onChange={e =>
                              setQuantities(prev => ({
                                ...prev,
                                [product.id]: e.target.value,
                              }))
                            }
                          />
                        )}
                      </>
                    )}
                    {isStockOut && (
                      <>
                        <span className="text-xs text-muted-foreground">
                          Stock: {product.current_quantity ?? 0}
                        </span>
                        {isSelected && (
                          <div className="flex flex-col items-end gap-0.5">
                            <Input
                              type="number"
                              min={1}
                              max={product.current_quantity}
                              placeholder="Qty"
                              className="w-20 h-7 text-sm"
                              value={qty}
                              onChange={e =>
                                setQuantities(prev => ({
                                  ...prev,
                                  [product.id]: e.target.value,
                                }))
                              }
                            />
                            {exceedsStock && (
                              <span className="text-xs text-red-500">
                                Max: {product.current_quantity}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-background shrink-0">
          {/* Shared value input per batch type */}
          {isMarkup && (
            <div className="flex items-center gap-4">
              <Label className="shrink-0 text-sm">
                New Markup % (applied to all selected)
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g. 15"
                className="w-32 h-8"
                value={sharedMarkup}
                onChange={e => setSharedMarkup(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          )}

          {isBasePrice && (
            <div className="flex items-center gap-4">
              <Label className="shrink-0 text-sm">
                New Base Price (applied to all selected)
              </Label>
              <span className="text-sm text-muted-foreground">₱</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                className="w-32 h-8"
                value={sharedPrice}
                onChange={e => setSharedPrice(e.target.value)}
              />
            </div>
          )}

          {isStockIn && (
            <div className="flex items-center gap-4">
              <Label className="shrink-0 text-sm">
                Unit Cost for all selected (optional)
              </Label>
              <span className="text-sm text-muted-foreground">₱</span>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Leave blank to use base price"
                className="w-48 h-8"
                value={sharedUnitCost}
                onChange={e => setSharedUnitCost(e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                Fill quantity per item in the list above.
              </span>
            </div>
          )}

          {isStockOut && (
            <div className="flex items-center gap-4">
              <Label className="shrink-0 text-sm">
                Reason (applied to all selected)
              </Label>
              <Select
                value={sharedReason}
                onValueChange={v => v && setSharedReason(v as StockOutReason)}
              >
                <SelectTrigger className="w-48 h-8">
                  <SelectValue>
                    {sharedReason
                      ? STOCK_OUT_REASONS.find(r => r.value === sharedReason)
                          ?.label
                      : "Select reason"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STOCK_OUT_REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                Fill quantity per item in the list above.
              </span>
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} product{selectedIds.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAdd}
                disabled={
                  isPending || selectedIds.size === 0 || !isSharedValueValid()
                }
              >
                {isPending
                  ? `Adding ${selectedIds.size} items...`
                  : `Add ${selectedIds.size} Item${selectedIds.size !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
