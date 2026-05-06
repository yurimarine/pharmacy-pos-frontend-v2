"use client";

import { useState, useEffect, useTransition } from "react";
import { XIcon, PlusIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { createStockTransfer } from "@/app/admin/stock-transfers/actions";
import { getPharmacies } from "@/app/admin/pharmacies/actions";
import { getProducts } from "@/app/admin/products/actions";
import {
  getAvailableBatchesForProduct,
  getReceiptsWithAvailableStock,
  getWarehouseInventoryByReceipt,
} from "@/app/admin/warehouse/actions";
import type { Pharmacy } from "@/types/pharmacy";
import type { WarehouseInventoryWithProduct } from "@/types/inventory";
import type { ProductOption } from "@/components/ui/product-combobox";
import { ProductCombobox } from "@/components/ui/product-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TransferMode = "by_product" | "by_receipt";

type TransferItemRow = {
  product_id: string;
  product_name: string;
  warehouse_inventory_id: string;
  available_batches: WarehouseInventoryWithProduct[]; // non-empty = receipt-mode locked row
  quantity: number;
  expiry_date: string | null;
  receipt_number: string | null;
};

function emptyRow(): TransferItemRow {
  return {
    product_id: "",
    product_name: "",
    warehouse_inventory_id: "",
    available_batches: [],
    quantity: 1,
    expiry_date: null,
    receipt_number: null,
  };
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "No expiry";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatBatchLabel(batch: WarehouseInventoryWithProduct): string {
  const lot = batch.lot_number ? `Lot: ${batch.lot_number}` : "No Lot";
  const exp = formatDateShort(batch.expiry_date);
  return `${lot} | Exp: ${exp}`;
}

export default function AddStockTransferModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<TransferMode>("by_product");
  const [pharmacyId, setPharmacyId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<TransferItemRow[]>([emptyRow()]);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [availableReceipts, setAvailableReceipts] = useState<
    {
      id: string;
      receipt_number: string;
      received_at: string | null;
      item_count: number;
    }[]
  >([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null,
  );
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  const [batchesByProduct, setBatchesByProduct] = useState<
    Map<string, WarehouseInventoryWithProduct[]>
  >(new Map());
  const [loadingBatches, setLoadingBatches] = useState<Set<string>>(new Set());

  const [isPending, startTransition] = useTransition();

  const fetchBatchesForProduct = (productId: string) => {
    if (!productId || batchesByProduct.has(productId)) return;
    setLoadingBatches(prev => new Set(prev).add(productId));
    getAvailableBatchesForProduct(productId)
      .then(batches => {
        setBatchesByProduct(prev => new Map(prev).set(productId, batches));
      })
      .catch(() => {})
      .finally(() => {
        setLoadingBatches(prev => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      });
  };

  useEffect(() => {
    // Products: fire and forget
    getProducts({ status: "active", pageSize: 1000 })
      .then(({ data }) =>
        setProducts(
          data.map(p => ({
            id: p.id,
            name: p.product_name,
            generic_name: p.generic_name,
            base_price: p.unit_cost,
          })),
        ),
      )
      .catch(() => {});

    // Pharmacies + receipts: gate loading spinner on both
    Promise.all([getPharmacies(), getReceiptsWithAvailableStock()])
      .then(([pharmacyData, receiptData]) => {
        setPharmacies(pharmacyData);
        setAvailableReceipts(receiptData);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleReceiptSelect = async (receiptId: string) => {
    setSelectedReceiptId(receiptId || null);
    if (!receiptId) {
      setItems([]);
      return;
    }
    setIsLoadingReceipt(true);
    try {
      const batches = await getWarehouseInventoryByReceipt(receiptId);
      setItems(
        batches.map(batch => ({
          product_id: batch.product?.id ?? "",
          product_name: batch.product?.product_name ?? "",
          warehouse_inventory_id: batch.id,
          available_batches: [batch],
          quantity: batch.quantity_remaining,
          expiry_date: batch.expiry_date,
          receipt_number: batch.receipt_item?.receipt?.receipt_number ?? null,
        })),
      );
    } catch {
      toast.error("Failed to load receipt items");
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  const updateItem = (index: number, patch: Partial<TransferItemRow>) => {
    setItems(prev =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, p: ProductOption | null) => {
    updateItem(index, {
      product_id: p?.id ?? "",
      product_name: p?.name ?? "",
      warehouse_inventory_id: "",
      available_batches: [],
      expiry_date: null,
      receipt_number: null,
    });
    if (p?.id) fetchBatchesForProduct(p.id);
  };

  const handleBatchChange = (
    index: number,
    batchId: string | null,
    productId: string,
  ) => {
    if (!batchId) return;
    const batch = (batchesByProduct.get(productId) ?? []).find(
      b => b.id === batchId,
    );
    if (!batch) return;
    updateItem(index, {
      warehouse_inventory_id: batchId,
      expiry_date: batch.expiry_date,
      receipt_number: batch.receipt_item?.receipt?.receipt_number ?? null,
    });
  };

  const usedBatchIds = (excludeIndex: number) =>
    new Set(
      items
        .filter((_, i) => i !== excludeIndex)
        .map(r => r.warehouse_inventory_id)
        .filter(Boolean),
    );

  const getRowBatch = (
    row: TransferItemRow,
  ): WarehouseInventoryWithProduct | undefined => {
    if (row.available_batches.length > 0) {
      return (
        row.available_batches.find(b => b.id === row.warehouse_inventory_id) ??
        row.available_batches[0]
      );
    }
    return (batchesByProduct.get(row.product_id) ?? []).find(
      b => b.id === row.warehouse_inventory_id,
    );
  };

  const hasQuantityError = items.some(row => {
    if (!row.warehouse_inventory_id) return false;
    const batch = getRowBatch(row);
    return batch !== undefined && row.quantity > batch.quantity_remaining;
  });

  const totalQty = items
    .filter(r => r.warehouse_inventory_id)
    .reduce((sum, r) => sum + r.quantity, 0);

  const selectedReceipt = availableReceipts.find(
    r => r.id === selectedReceiptId,
  );

  const handleSubmit = () => {
    const validItems = items.filter(
      r => r.product_id && r.warehouse_inventory_id,
    );
    if (!pharmacyId) {
      setItemsError("Please select a destination pharmacy.");
      return;
    }
    if (validItems.length === 0) {
      setItemsError(
        "At least one item with a selected product and batch is required.",
      );
      return;
    }
    if (hasQuantityError) {
      setItemsError("One or more quantities exceed available stock.");
      return;
    }
    setItemsError(null);

    startTransition(async () => {
      const result = await createStockTransfer({
        to_pharmacy_id: pharmacyId,
        notes: notes.trim() || null,
        items: validItems.map(row => ({
          warehouse_inventory_id: row.warehouse_inventory_id,
          product_id: row.product_id,
          quantity: row.quantity,
          expiry_date: row.expiry_date,
        })),
      });

      if (result.success) {
        toast.success("Stock transfer created.");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Failed to create stock transfer.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col max-h-[90vh] sm:max-w-4xl md:max-w-7xl p-0"
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-0">
          <DialogTitle>New Stock Transfer</DialogTitle>
          <DialogDescription>
            Transfer warehouse stock to a destination pharmacy.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <Spinner text="Loading..." />
          ) : (
            <>
              {/* Header fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="st-pharmacy">Destination Pharmacy</Label>
                  <Select
                    value={pharmacyId}
                    onValueChange={v => v !== null && setPharmacyId(v)}
                  >
                    <SelectTrigger id="st-pharmacy">
                      <SelectValue>
                        {pharmacyId
                          ? (pharmacies.find(p => p.id === pharmacyId)?.name ??
                            "Select pharmacy")
                          : "Select destination pharmacy"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {pharmacies.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <Label htmlFor="st-notes">Notes</Label>
                  <Textarea
                    id="st-notes"
                    placeholder="Optional notes…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2 mb-5">
                <Button
                  type="button"
                  variant={mode === "by_product" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMode("by_product");
                    setSelectedReceiptId(null);
                    setItems([emptyRow()]);
                  }}
                >
                  By Product
                </Button>
                <Button
                  type="button"
                  variant={mode === "by_receipt" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setMode("by_receipt");
                    setItems([]);
                  }}
                >
                  By Receipt
                </Button>
              </div>

              {/* By Receipt: receipt selector */}
              {mode === "by_receipt" && (
                <div className="flex flex-col gap-1.5 mb-5">
                  <Label>Receipt</Label>
                  <Select
                    value={selectedReceiptId ?? ""}
                    onValueChange={v => v !== null && handleReceiptSelect(v)}
                  >
                    <SelectTrigger className="max-w-sm">
                      <SelectValue>
                        {selectedReceiptId
                          ? (availableReceipts.find(
                              r => r.id === selectedReceiptId,
                            )?.receipt_number ?? "Unknown")
                          : "Select a receipt…"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {availableReceipts.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.receipt_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLoadingReceipt && (
                    <p className="text-xs text-muted-foreground">
                      Loading receipt items…
                    </p>
                  )}
                </div>
              )}

              {/* Line items */}
              {(mode === "by_product" || items.length > 0) && (
                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-semibold">
                    Transfer Items
                  </Label>

                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_220px_80px_32px] gap-2 px-1">
                    <span className="text-xs text-muted-foreground">
                      Product
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Lot / Expiry
                    </span>
                    <span className="text-xs text-muted-foreground">Qty</span>
                    <span />
                  </div>

                  {items.map((row, i) => {
                    const isReceiptRow = row.available_batches.length > 0;
                    const selectedBatch = getRowBatch(row);
                    const maxQty =
                      selectedBatch?.quantity_remaining ?? Infinity;
                    const isOverLimit =
                      row.warehouse_inventory_id &&
                      selectedBatch !== undefined &&
                      row.quantity > selectedBatch.quantity_remaining;

                    if (isReceiptRow) {
                      const lockedBatch = row.available_batches[0];
                      return (
                        <div
                          key={i}
                          className="grid grid-cols-[1fr_220px_80px_32px] gap-2 items-start"
                        >
                          {/* Product (read-only) */}
                          <div className="bg-muted px-2.5 py-2 rounded-md min-h-9 flex flex-col justify-center">
                            <span className="text-sm font-medium leading-tight">
                              {row.product_name || "—"}
                            </span>
                          </div>

                          {/* Batch (read-only) */}
                          <div className="bg-muted px-2.5 py-2 rounded-md min-h-9 flex items-center">
                            <span className="text-xs font-mono leading-tight truncate">
                              {formatBatchLabel(lockedBatch)}
                            </span>
                          </div>

                          {/* Qty with validation */}
                          <div className="flex flex-col gap-0.5">
                            <Input
                              type="number"
                              min={1}
                              max={lockedBatch.quantity_remaining}
                              value={row.quantity}
                              onChange={e =>
                                updateItem(i, {
                                  quantity: Math.max(1, Number(e.target.value)),
                                })
                              }
                              className={
                                isOverLimit ? "border-destructive" : ""
                              }
                            />
                            {isOverLimit && (
                              <p className="text-xs text-destructive">
                                Max: {lockedBatch.quantity_remaining}
                              </p>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeItem(i)}
                            aria-label="Remove item"
                          >
                            <XIcon className="size-3.5" />
                          </Button>
                        </div>
                      );
                    }

                    // By Product mode row (or extra product row in By Receipt mode)
                    const batches = batchesByProduct.get(row.product_id) ?? [];
                    const used = usedBatchIds(i);
                    const availableBatches = batches.filter(
                      b => !used.has(b.id),
                    );
                    const isLoadingBatch = loadingBatches.has(row.product_id);
                    const selectedBatchForSelect = batches.find(
                      b => b.id === row.warehouse_inventory_id,
                    );

                    return (
                      <div
                        key={i}
                        className="grid grid-cols-[1fr_220px_80px_32px] gap-2 items-start"
                      >
                        <ProductCombobox
                          options={products}
                          value={row.product_id}
                          onChange={p => handleProductChange(i, p)}
                          placeholder="Search product…"
                        />

                        <Select
                          value={row.warehouse_inventory_id}
                          onValueChange={v =>
                            handleBatchChange(i, v, row.product_id)
                          }
                          disabled={!row.product_id || isLoadingBatch}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              {isLoadingBatch
                                ? "Loading…"
                                : selectedBatchForSelect
                                  ? formatBatchLabel(selectedBatchForSelect)
                                  : row.product_id
                                    ? availableBatches.length === 0
                                      ? "No batches available"
                                      : "Select batch…"
                                    : "Select product first"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {availableBatches.map(batch => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {formatBatchLabel(batch)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex flex-col gap-0.5">
                          <Input
                            type="number"
                            min={1}
                            max={maxQty === Infinity ? undefined : maxQty}
                            value={row.quantity}
                            onChange={e =>
                              updateItem(i, {
                                quantity: Math.max(1, Number(e.target.value)),
                              })
                            }
                            disabled={!row.warehouse_inventory_id}
                            className={isOverLimit ? "border-destructive" : ""}
                          />
                          {isOverLimit && selectedBatch && (
                            <p className="text-xs text-destructive">
                              Max: {selectedBatch.quantity_remaining}
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeItem(i)}
                          disabled={mode === "by_product" && items.length === 1}
                          aria-label="Remove item"
                        >
                          <XIcon className="size-3.5" />
                        </Button>
                      </div>
                    );
                  })}

                  {itemsError && (
                    <p className="text-sm text-destructive">{itemsError}</p>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => setItems(prev => [...prev, emptyRow()])}
                  >
                    <PlusIcon className="size-4" />
                    Add Item
                  </Button>

                  {/* Summary */}
                  <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground border-t">
                    {mode === "by_receipt" && selectedReceipt ? (
                      <span>
                        Receipt:{" "}
                        <span className="font-medium text-foreground font-mono">
                          {selectedReceipt.receipt_number}
                        </span>{" "}
                        ·{" "}
                        <span className="font-medium text-foreground">
                          {items.filter(r => r.warehouse_inventory_id).length}
                        </span>{" "}
                        items
                      </span>
                    ) : (
                      <span>
                        Total Items:{" "}
                        <span className="font-medium text-foreground">
                          {items.filter(r => r.warehouse_inventory_id).length}
                        </span>
                      </span>
                    )}
                    <span>|</span>
                    <span>
                      Total Units:{" "}
                      <span className="font-medium text-foreground">
                        {totalQty}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 px-6 pb-6 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isPending || hasQuantityError}
          >
            {isPending ? "Creating…" : "Create Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
