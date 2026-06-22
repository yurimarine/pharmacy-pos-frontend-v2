"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon, XIcon } from "lucide-react";
import {
  createWarehouseReceipt,
  updateWarehouseReceipt,
} from "@/app/admin/warehouse-receipts/actions";
import { getProducts } from "@/app/admin/products/actions";
import type {
  WarehouseReceiptWithItems,
  PurchaseOrderWithItems,
} from "@/types/inventory";
import type { ProductOption } from "@/components/ui/product-combobox";
import { ProductCombobox } from "@/components/ui/product-combobox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReceiptLineItem = {
  id?: string;
  product_id: string;
  product_name: string;
  po_item_id: string | null;
  quantity_received: number;
  unit_cost: number;
  lot_number: string;
  expiry_date: string;
  notes: string;
};

const emptyItem = (): ReceiptLineItem => ({
  product_id: "",
  product_name: "",
  po_item_id: null,
  quantity_received: 1,
  unit_cost: 0,
  lot_number: "",
  expiry_date: "",
  notes: "",
});

type Props = {
  mode: "create" | "edit";
  receipt?: WarehouseReceiptWithItems;
  suppliers: { id: string; name: string }[];
  submittedPOs: PurchaseOrderWithItems[];
};

export function WarehouseReceiptForm({
  mode,
  receipt,
  suppliers,
  submittedPOs,
}: Props) {
  const isEdit = mode === "edit" && !!receipt;

  const [poId, setPoId] = useState<string>(isEdit ? (receipt.po_id ?? "") : "");
  const [supplierId, setSupplierId] = useState<string>(
    isEdit ? (receipt.supplier_id ?? "") : "",
  );
  const [notes, setNotes] = useState<string>(
    isEdit ? (receipt.notes ?? "") : "",
  );
  const [items, setItems] = useState<ReceiptLineItem[]>(
    isEdit && receipt.items?.length
      ? receipt.items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.products?.product_name ?? "",
          po_item_id: item.po_item_id ?? null,
          quantity_received: item.quantity_received,
          unit_cost: item.unit_cost,
          lot_number: item.lot_number ?? "",
          expiry_date: item.expiry_date ?? "",
          notes: item.notes ?? "",
        }))
      : [emptyItem()],
  );

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, []);

  const handlePOSelect = (selectedPoId: string) => {
    setPoId(selectedPoId);

    if (!selectedPoId) {
      setItems([emptyItem()]);
      setSupplierId("");
      return;
    }

    const selectedPO = submittedPOs.find(po => po.id === selectedPoId);
    if (!selectedPO) return;

    if (selectedPO.supplier_id) {
      setSupplierId(selectedPO.supplier_id);
    }

    if (selectedPO.items?.length > 0) {
      setItems(
        selectedPO.items.map(item => ({
          product_id: item.product_id,
          product_name: item.products?.product_name ?? "",
          po_item_id: item.id,
          quantity_received: item.quantity_ordered,
          unit_cost: item.unit_cost,
          lot_number: "",
          expiry_date: "",
          notes: "",
        })),
      );
    } else {
      setItems([emptyItem()]);
    }
  };

  const updateItem = (index: number, updates: Partial<ReceiptLineItem>) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const totalQty = useMemo(
    () => items.reduce((s, i) => s + i.quantity_received, 0),
    [items],
  );

  const totalCost = useMemo(
    () => items.reduce((s, i) => s + i.quantity_received * i.unit_cost, 0),
    [items],
  );

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.product_id);
    if (validItems.length === 0) {
      setItemsError("Add at least one received product");
      return;
    }
    setItemsError(null);
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      po_id: poId || null,
      supplier_id: supplierId || null,
      notes: notes.trim() || null,
      items: validItems.map(i => ({
        id: i.id,
        product_id: i.product_id,
        po_item_id: i.po_item_id,
        quantity_received: i.quantity_received,
        unit_cost: i.unit_cost,
        lot_number: i.lot_number || null,
        expiry_date: i.expiry_date || null,
        notes: i.notes || null,
      })),
    };

    const result = isEdit
      ? await updateWarehouseReceipt(receipt.id, payload)
      : await createWarehouseReceipt(payload);

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
              ? "New Warehouse Receipt"
              : `Edit ${receipt?.receipt_number ?? "Warehouse Receipt"}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Record incoming stock from a supplier."
              : `Editing draft receipt ${receipt?.receipt_number ?? ""}.`}
          </p>
        </div>
        <div>
          <Button
            variant="default"
            size="sm"
            render={<Link href="/admin/warehouse-receipts" />}
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

        {/* ── Section 1: Receipt details ─────────────────────────── */}
        <section className="pb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b">
            Receipt details
          </p>

          {/* Receipt number strip */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">
              Receipt number
            </span>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
              {isEdit ? receipt.receipt_number : "Auto-generated on save"}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {/* Row 1: po_id | supplier_id */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wr-po">Link to purchase order</Label>
                <Select
                  value={poId}
                  onValueChange={v => v !== null && handlePOSelect(v)}
                >
                  <SelectTrigger id="wr-po">
                    <SelectValue>
                      {poId
                        ? (submittedPOs.find(p => p.id === poId)?.po_number ??
                          "Unknown PO")
                        : "No PO — ad-hoc receiving"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No PO — ad-hoc receiving</SelectItem>
                    {submittedPOs.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                        No submitted purchase orders
                      </div>
                    ) : (
                      submittedPOs.map(po => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.po_number}
                          {po.supplier && (
                            <span className="text-muted-foreground">
                              {" "}
                              — {po.supplier.name}
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecting a PO auto-fills items and supplier
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wr-supplier">Supplier</Label>
                <Select
                  value={supplierId}
                  onValueChange={v => v !== null && setSupplierId(v)}
                >
                  <SelectTrigger id="wr-supplier">
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
            </div>

            {/* Row 2: notes (full width) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wr-notes">Notes</Label>
              <Textarea
                id="wr-notes"
                rows={2}
                placeholder="Optional notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Section 2: Received items ──────────────────────────── */}
        <section className="pt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b">
            Received items
          </p>

          {/* Summary strip */}
          <div className="flex items-baseline gap-3 rounded-md bg-muted/50 px-4 py-3 mb-4">
            <span className="text-sm font-medium">
              {items.filter(i => i.product_id).length} item(s)
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-sm font-medium">
              {totalQty} units received
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-sm font-medium">
              ₱{fmt(totalCost)} estimated
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[2fr_140px_110px_120px_130px_1fr_36px] gap-2 px-1 mb-2">
            <span className="text-xs text-muted-foreground">Product</span>
            <span className="text-xs text-muted-foreground">Qty received</span>
            <span className="text-xs text-muted-foreground">Unit cost (₱)</span>
            <span className="text-xs text-muted-foreground">Lot #</span>
            <span className="text-xs text-muted-foreground">Expiry date</span>
            <span className="text-xs text-muted-foreground">Notes</span>
            <span />
          </div>

          {/* Item rows */}
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[2fr_140px_110px_120px_130px_1fr_36px] gap-2 items-center"
              >
                {/* Product — read-only if PO-linked, combobox if ad-hoc */}
                {item.po_item_id ? (
                  <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center text-sm">
                    {item.product_name}
                  </div>
                ) : (
                  <ProductCombobox
                    options={products}
                    value={item.product_id}
                    onChange={p => {
                      updateItem(i, {
                        product_id: p?.id ?? "",
                        product_name: p?.name ?? "",
                        unit_cost: p ? p.base_price : 0,
                      });
                      if (itemsError) setItemsError(null);
                    }}
                    placeholder="Search product..."
                  />
                )}

                {/* Qty received */}
                <QuantityInput
                  value={item.quantity_received}
                  onChange={v =>
                    updateItem(i, { quantity_received: Math.max(1, v) })
                  }
                  min={1}
                />

                {/* Unit cost */}
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unit_cost}
                  onChange={e =>
                    updateItem(i, { unit_cost: Number(e.target.value) })
                  }
                  placeholder="0.00"
                />

                {/* Lot # */}
                <Input
                  placeholder="Optional"
                  value={item.lot_number}
                  onChange={e => updateItem(i, { lot_number: e.target.value })}
                />

                {/* Expiry date */}
                <Input
                  type="date"
                  value={item.expiry_date}
                  onChange={e => updateItem(i, { expiry_date: e.target.value })}
                />

                {/* Notes */}
                <Input
                  placeholder="Optional"
                  value={item.notes}
                  onChange={e => updateItem(i, { notes: e.target.value })}
                />

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                  aria-label="Remove item"
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {itemsError && (
            <p className="text-xs text-destructive mt-2">{itemsError}</p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setItems(prev => [...prev, emptyItem()])}
          >
            <PlusIcon className="size-4" />
            Add item
          </Button>
        </section>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="border-t pt-6 mt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Complete the receipt after saving to add stock to warehouse
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href="/admin/warehouse-receipts" />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Draft"
                  : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
