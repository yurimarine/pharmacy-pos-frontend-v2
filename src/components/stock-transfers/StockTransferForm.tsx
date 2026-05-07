"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createStockTransfer,
  updateStockTransfer,
} from "@/app/admin/stock-transfers/actions";
import { getProducts } from "@/app/admin/products/actions";
import {
  getAvailableBatchesForProduct,
  getReceiptsWithAvailableStock,
  getWarehouseInventoryByReceipt,
} from "@/app/admin/warehouse/actions";
import type { StockTransferWithItems, WarehouseInventoryWithProduct } from "@/types/inventory";
import type { ProductOption } from "@/components/ui/product-combobox";
import { ProductCombobox } from "@/components/ui/product-combobox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TransferMode = "by_product" | "by_receipt";

type TransferRow = {
  product_id: string;
  product_name: string;
  warehouse_inventory_id: string;
  available_batches: WarehouseInventoryWithProduct[];
  isLoadingBatches: boolean;
  isReceiptRow: boolean;
  quantity: number;
  expiry_date: string | null;
  receipt_number: string | null;
};

const emptyRow = (): TransferRow => ({
  product_id: "",
  product_name: "",
  warehouse_inventory_id: "",
  available_batches: [],
  isLoadingBatches: false,
  isReceiptRow: false,
  quantity: 1,
  expiry_date: null,
  receipt_number: null,
});

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No expiry";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Props = {
  mode: "create" | "edit";
  transfer?: StockTransferWithItems;
  pharmacies: { id: string; name: string }[];
};

export function StockTransferForm({ mode, transfer, pharmacies }: Props) {
  const isEdit = mode === "edit" && !!transfer;

  // Header state
  const [toPharmacyId, setToPharmacyId] = useState<string>(
    isEdit ? transfer.to_pharmacy_id : "",
  );
  const [notes, setNotes] = useState<string>(isEdit ? (transfer.notes ?? "") : "");
  const [transferMode, setTransferMode] = useState<TransferMode>("by_product");

  // Line items
  const [items, setItems] = useState<TransferRow[]>(
    isEdit && transfer.items?.length
      ? transfer.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product?.product_name ?? "",
          warehouse_inventory_id: item.warehouse_inventory_id,
          available_batches: [],
          isLoadingBatches: true,
          isReceiptRow: false,
          quantity: item.quantity,
          expiry_date: item.expiry_date,
          receipt_number: null,
        }))
      : [emptyRow()],
  );

  // Product list for combobox
  const [products, setProducts] = useState<ProductOption[]>([]);

  // By Receipt mode state
  const [availableReceipts, setAvailableReceipts] = useState<
    { id: string; receipt_number: string; received_at: string | null; item_count: number }[]
  >([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingReceiptItems, setIsLoadingReceiptItems] = useState(false);

  // UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  // On mount: fetch products + available receipts
  useEffect(() => {
    getProducts({ status: "active", pageSize: 1000 })
      .then(({ data }) => {
        setProducts(
          data.map(p => ({
            id: p.id,
            name: p.product_name,
            generic_name: p.generic_name,
            base_price: p.unit_cost,
          })),
        );
      })
      .catch(() => {});

    getReceiptsWithAvailableStock()
      .then(setAvailableReceipts)
      .catch(() => toast.error("Failed to load receipts"))
      .finally(() => setIsLoadingInitial(false));
  }, []);

  // Edit mode: fetch batches for all pre-filled items
  useEffect(() => {
    if (!isEdit || !transfer.items?.length) return;

    const uniqueProductIds = [
      ...new Set(transfer.items.map(i => i.product_id).filter(Boolean)),
    ];

    Promise.all(
      uniqueProductIds.map(pid =>
        getAvailableBatchesForProduct(pid).then(batches => ({ pid, batches })),
      ),
    )
      .then(results => {
        const batchMap = new Map(results.map(r => [r.pid, r.batches]));
        setItems(prev =>
          prev.map(row => {
            const batches = batchMap.get(row.product_id) ?? [];
            const matchedBatch = batches.find(b => b.id === row.warehouse_inventory_id);
            return {
              ...row,
              available_batches: batches,
              isLoadingBatches: false,
              receipt_number:
                matchedBatch?.receipt_item?.receipt?.receipt_number ?? null,
            };
          }),
        );
      })
      .catch(() => {
        setItems(prev => prev.map(row => ({ ...row, isLoadingBatches: false })));
        toast.error("Failed to load batch data");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateRow = (index: number, updates: Partial<TransferRow>) => {
    setItems(prev =>
      prev.map((row, i) => (i === index ? { ...row, ...updates } : row)),
    );
  };

  const removeRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleModeSwitch = (newMode: TransferMode) => {
    setTransferMode(newMode);
    setSelectedReceiptId(null);
    setItems(newMode === "by_product" ? [emptyRow()] : []);
    setItemsError(null);
  };

  const handleReceiptSelect = (receiptId: string) => {
    setSelectedReceiptId(receiptId || null);
    setItems([]);

    if (!receiptId) return;

    setIsLoadingReceiptItems(true);
    getWarehouseInventoryByReceipt(receiptId)
      .then(batches => {
        setItems(
          batches.map(batch => ({
            product_id: batch.product?.id ?? "",
            product_name: batch.product?.product_name ?? "",
            warehouse_inventory_id: batch.id,
            available_batches: [batch],
            isLoadingBatches: false,
            isReceiptRow: true,
            quantity: batch.quantity_remaining,
            expiry_date: batch.expiry_date,
            receipt_number: batch.receipt_item?.receipt?.receipt_number ?? null,
          })),
        );
      })
      .catch(() => {
        toast.error("Failed to load receipt items");
        setItems([emptyRow()]);
      })
      .finally(() => setIsLoadingReceiptItems(false));
  };

  const handleProductSelect = async (index: number, option: ProductOption | null) => {
    if (!option) {
      updateRow(index, {
        product_id: "",
        product_name: "",
        warehouse_inventory_id: "",
        available_batches: [],
        isLoadingBatches: false,
        expiry_date: null,
        receipt_number: null,
      });
      return;
    }

    updateRow(index, {
      product_id: option.id,
      product_name: option.name,
      warehouse_inventory_id: "",
      available_batches: [],
      isLoadingBatches: true,
      quantity: 1,
      expiry_date: null,
      receipt_number: null,
    });

    try {
      const batches = await getAvailableBatchesForProduct(option.id);
      const autoSelect =
        batches.length === 1
          ? {
              warehouse_inventory_id: batches[0].id,
              expiry_date: batches[0].expiry_date,
              receipt_number:
                batches[0].receipt_item?.receipt?.receipt_number ?? null,
            }
          : {};
      updateRow(index, {
        available_batches: batches,
        isLoadingBatches: false,
        ...autoSelect,
      });
    } catch {
      updateRow(index, { isLoadingBatches: false });
      toast.error("Failed to load batches");
    }
  };

  const usedBatchIds = (excludeIndex: number) =>
    new Set(
      items
        .filter((_, i) => i !== excludeIndex)
        .map(r => r.warehouse_inventory_id)
        .filter(Boolean),
    );

  const hasQuantityError = items.some(row => {
    if (!row.warehouse_inventory_id) return false;
    const batch = row.available_batches.find(b => b.id === row.warehouse_inventory_id);
    return batch !== undefined && row.quantity > batch.quantity_remaining;
  });

  const totalUnits = useMemo(
    () => items.reduce((s, r) => s + r.quantity, 0),
    [items],
  );

  const handleSubmit = async () => {
    if (!toPharmacyId) {
      setFormError("Please select a destination pharmacy");
      return;
    }

    const validItems = items.filter(i => i.product_id && i.warehouse_inventory_id);
    if (validItems.length === 0) {
      setItemsError("Add at least one item with a batch selected");
      return;
    }
    if (hasQuantityError) {
      setItemsError("Fix quantity errors before submitting");
      return;
    }

    setFormError(null);
    setItemsError(null);
    setIsSubmitting(true);

    const payload = {
      to_pharmacy_id: toPharmacyId,
      notes: notes.trim() || null,
      items: validItems.map(i => ({
        warehouse_inventory_id: i.warehouse_inventory_id,
        product_id: i.product_id,
        quantity: i.quantity,
        expiry_date: i.expiry_date,
      })),
    };

    const result = isEdit
      ? await updateStockTransfer(transfer.id, payload)
      : await createStockTransfer(payload);

    if (result?.error) {
      setFormError(result.error);
      setIsSubmitting(false);
    }
    // On success: server redirects
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title + back button */}
      <div className="flex justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "create"
              ? "New Stock Transfer"
              : `Edit ${transfer?.transfer_number ?? "Stock Transfer"}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Move stock from the warehouse to a pharmacy."
              : `Editing draft transfer ${transfer?.transfer_number ?? ""}.`}
          </p>
        </div>
        <div>
          <Button
            variant="default"
            size="sm"
            render={<Link href="/admin/stock-transfers" />}
            nativeButton={false}
          >
            <ChevronLeftIcon className="size-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Container */}
      <div className="flex flex-col gap-0">
        {/* Error banner */}
        {formError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive mb-6">
            {formError}
          </div>
        )}

        {/* ── Section 1: Transfer details ────────────────────────── */}
        <section className="pb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b">
            Transfer details
          </p>

          <div className="flex flex-col gap-4">
            {/* Row 1: pharmacy | notes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="st-pharmacy">
                  To pharmacy <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={toPharmacyId}
                  onValueChange={v => v !== null && setToPharmacyId(v)}
                >
                  <SelectTrigger id="st-pharmacy">
                    <SelectValue>
                      {toPharmacyId
                        ? (pharmacies.find(p => p.id === toPharmacyId)?.name ??
                          "Select pharmacy...")
                        : "Select pharmacy..."}
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="st-notes">Notes</Label>
                <Input
                  id="st-notes"
                  placeholder="Optional transfer notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: mode toggle */}
            <div className="flex flex-col gap-1.5">
              <Label>Transfer mode</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={transferMode === "by_product" ? "default" : "outline"}
                  onClick={() => handleModeSwitch("by_product")}
                >
                  By product
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={transferMode === "by_receipt" ? "default" : "outline"}
                  onClick={() => handleModeSwitch("by_receipt")}
                >
                  By receipt
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                By receipt auto-populates items from a completed receiving
              </p>
            </div>

            {/* By Receipt: receipt selector */}
            {transferMode === "by_receipt" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="st-receipt">Select receipt</Label>
                {isLoadingInitial ? (
                  <div className="h-9 rounded-md border bg-muted/50 flex items-center px-3 text-sm text-muted-foreground">
                    Loading available receipts...
                  </div>
                ) : (
                  <Select
                    value={selectedReceiptId ?? ""}
                    onValueChange={v => v !== null && handleReceiptSelect(v)}
                  >
                    <SelectTrigger id="st-receipt">
                      <SelectValue>
                        {selectedReceiptId
                          ? (availableReceipts.find(r => r.id === selectedReceiptId)
                              ?.receipt_number ?? "Unknown")
                          : "Select a receipt..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {availableReceipts.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          <div className="flex flex-col">
                            <span className="font-mono font-medium text-sm">
                              {r.receipt_number}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {r.item_count} product(s)
                              {r.received_at && ` · ${formatDate(r.received_at)}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {isLoadingReceiptItems && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Loading receipt items...
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* ── Section 2: Transfer items ──────────────────────────── */}
        <section className="pt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b">
            Transfer items
          </p>

          {/* Summary strip */}
          <div className="flex items-baseline gap-3 rounded-md bg-muted/50 px-4 py-3 mb-4">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Summary →
            </span>
            <span className="text-sm font-medium">
              {items.filter(i => i.product_id).length} item(s)
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-sm font-medium">{totalUnits} units</span>
            {toPharmacyId && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-sm font-medium">
                  → {pharmacies.find(p => p.id === toPharmacyId)?.name}
                </span>
              </>
            )}
          </div>

          {itemsError && (
            <p className="text-xs text-destructive mb-3">{itemsError}</p>
          )}

          {/* Column headers */}
          {(transferMode === "by_product" || items.length > 0) && (
            <div className="grid grid-cols-[2fr_2fr_90px_120px_36px] gap-2 px-1 mb-2">
              <span className="text-xs text-muted-foreground">Product</span>
              <span className="text-xs text-muted-foreground">Batch</span>
              <span className="text-xs text-muted-foreground">Qty</span>
              <span className="text-xs text-muted-foreground">Expiry</span>
              <span />
            </div>
          )}

          {/* Item rows */}
          <div className="flex flex-col gap-2">
            {items.map((row, i) => {
              const selectedBatch = row.available_batches.find(
                b => b.id === row.warehouse_inventory_id,
              );
              const maxQty = selectedBatch?.quantity_remaining ?? Infinity;
              const isOver =
                !!row.warehouse_inventory_id &&
                selectedBatch !== undefined &&
                row.quantity > selectedBatch.quantity_remaining;

              if (row.isReceiptRow) {
                const lockedBatch = row.available_batches[0];
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[2fr_2fr_90px_120px_36px] gap-2 items-start"
                  >
                    {/* Product — read-only */}
                    <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center text-sm">
                      {row.product_name}
                    </div>

                    {/* Batch — read-only */}
                    <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center text-xs font-mono text-muted-foreground">
                      {row.receipt_number ?? "—"}
                      {lockedBatch?.lot_number
                        ? ` | ${lockedBatch.lot_number}`
                        : " | No lot"}
                    </div>

                    {/* Qty with validation */}
                    <div className="flex flex-col gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={lockedBatch?.quantity_remaining}
                        value={row.quantity}
                        className={isOver ? "border-destructive" : ""}
                        onChange={e =>
                          updateRow(i, {
                            quantity: Math.max(1, Number(e.target.value)),
                          })
                        }
                      />
                      {isOver && (
                        <p className="text-xs text-destructive">
                          Max: {maxQty}
                        </p>
                      )}
                    </div>

                    {/* Expiry — read-only */}
                    <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">
                      {formatDate(row.expiry_date)}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeRow(i)}
                      aria-label="Remove item"
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  </div>
                );
              }

              // By Product row (or manual row in By Receipt mode)
              const used = usedBatchIds(i);
              const availableBatches = row.available_batches.filter(
                b => !used.has(b.id),
              );

              return (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_2fr_90px_120px_36px] gap-2 items-start"
                >
                  {/* Product combobox */}
                  <ProductCombobox
                    options={products}
                    value={row.product_id}
                    onChange={p => handleProductSelect(i, p)}
                    placeholder="Search product..."
                  />

                  {/* Batch selector */}
                  {row.isLoadingBatches ? (
                    <div className="h-9 rounded-md border bg-muted/50 flex items-center px-3 text-xs text-muted-foreground">
                      Loading batches...
                    </div>
                  ) : row.available_batches.length === 0 && row.product_id ? (
                    <div className="h-9 rounded-md border bg-muted/50 flex items-center px-3 text-xs text-destructive">
                      No stock available
                    </div>
                  ) : (
                    <Select
                      value={row.warehouse_inventory_id}
                      disabled={!row.product_id || row.isLoadingBatches}
                      onValueChange={val => {
                        if (!val) return;
                        const batch = row.available_batches.find(b => b.id === val);
                        updateRow(i, {
                          warehouse_inventory_id: val,
                          expiry_date: batch?.expiry_date ?? null,
                          receipt_number:
                            batch?.receipt_item?.receipt?.receipt_number ?? null,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {row.warehouse_inventory_id && selectedBatch
                            ? `${selectedBatch.receipt_item?.receipt?.receipt_number ?? "—"} | ${selectedBatch.lot_number ?? "No lot"} | ${selectedBatch.quantity_remaining} units`
                            : row.product_id
                              ? availableBatches.length === 0
                                ? "No batches available"
                                : "Select batch..."
                              : "Select product first"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableBatches.map(batch => (
                          <SelectItem key={batch.id} value={batch.id}>
                            <div className="flex flex-col">
                              <span className="text-sm font-mono">
                                {batch.receipt_item?.receipt?.receipt_number ?? "—"}
                                {" | "}
                                {batch.lot_number ?? "No lot"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {batch.expiry_date
                                  ? `Exp: ${formatDate(batch.expiry_date)}`
                                  : "No expiry"}
                                {" · "}
                                {batch.quantity_remaining} units available
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Qty with validation */}
                  <div className="flex flex-col gap-1">
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity}
                      className={isOver ? "border-destructive" : ""}
                      disabled={!row.warehouse_inventory_id}
                      onChange={e =>
                        updateRow(i, {
                          quantity: Math.max(1, Number(e.target.value)),
                        })
                      }
                    />
                    {isOver && (
                      <p className="text-xs text-destructive">Max: {maxQty}</p>
                    )}
                  </div>

                  {/* Expiry — read-only, auto-filled */}
                  <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center text-sm text-muted-foreground">
                    {formatDate(row.expiry_date)}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(i)}
                    disabled={transferMode === "by_product" && items.length === 1}
                    aria-label="Remove item"
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setItems(prev => [...prev, emptyRow()])}
          >
            <PlusIcon className="size-4" />
            {transferMode === "by_receipt" ? "Add item manually" : "Add item"}
          </Button>
        </section>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="border-t pt-6 mt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Select a pharmacy and at least one item to transfer
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href="/admin/stock-transfers" />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || hasQuantityError}
            >
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Save transfer"
                  : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
