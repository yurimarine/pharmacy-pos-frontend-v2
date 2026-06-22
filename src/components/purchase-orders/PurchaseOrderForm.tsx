"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon, XIcon } from "lucide-react";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
} from "@/app/admin/purchase-orders/actions";
import { getProducts } from "@/app/admin/products/actions";
import type { PurchaseOrderWithItems } from "@/types/inventory";
import type { ProductOption } from "@/components/ui/product-combobox";
import { ProductCombobox } from "@/components/ui/product-combobox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuantityInput } from "@/components/ui/QuantityInput";

type POLineItem = {
  product_id: string;
  product_name: string;
  quantity_ordered: number;
  unit_cost: number;
  notes: string;
};

const emptyItem = (): POLineItem => ({
  product_id: "",
  product_name: "",
  quantity_ordered: 1,
  unit_cost: 0,
  notes: "",
});

type Props = {
  mode: "create" | "edit";
  po?: PurchaseOrderWithItems;
  suppliers: { id: string; name: string }[];
};

export function PurchaseOrderForm({ mode, po, suppliers }: Props) {
  const isEdit = mode === "edit" && !!po;

  const [supplierId, setSupplierId] = useState<string>(
    isEdit ? (po.supplier_id ?? "") : "",
  );
  const [deliveryDate, setDeliveryDate] = useState<string>(
    isEdit ? (po.expected_delivery_date ?? "") : "",
  );
  const [notes, setNotes] = useState<string>(isEdit ? (po.notes ?? "") : "");
  const [items, setItems] = useState<POLineItem[]>(
    isEdit && po.items?.length
      ? po.items.map(item => ({
          product_id: item.product_id,
          product_name: item.products?.product_name ?? "",
          quantity_ordered: item.quantity_ordered,
          unit_cost: item.unit_cost,
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

  const updateItem = (index: number, updates: Partial<POLineItem>) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const estimatedTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.quantity_ordered * item.unit_cost,
        0,
      ),
    [items],
  );

  const fmt = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.product_id);
    if (validItems.length === 0) {
      setItemsError("Add at least one product to the order");
      return;
    }
    setItemsError(null);
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      supplier_id: supplierId || null,
      expected_delivery_date: deliveryDate || null,
      notes: notes.trim() || null,
      items: validItems.map(item => ({
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost,
        notes: item.notes.trim() || null,
      })),
    };

    const result = isEdit
      ? await updatePurchaseOrder(po.id, payload)
      : await createPurchaseOrder(payload);

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
              ? "New Purchase Order"
              : `Edit ${po?.po_number ?? "Purchase Order"}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Create a purchase order for supplier stock."
              : `Editing draft purchase order ${po?.po_number ?? ""}.`}
          </p>
        </div>
        <div>
          <Button
            variant="default"
            size="sm"
            render={<Link href="/admin/purchase-orders" />}
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

        {/* ── Section 1: Order details ───────────────────────────── */}
        <section className="pb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b">
            Order details
          </p>

          <div className="flex flex-col gap-4">
            {/* Row 1: supplier | expected delivery */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="po-supplier">Supplier</Label>
                <Select
                  value={supplierId}
                  onValueChange={v => v !== null && setSupplierId(v)}
                >
                  <SelectTrigger id="po-supplier">
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="po-delivery">Expected delivery</Label>
                <Input
                  id="po-delivery"
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: notes (full width) */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="po-notes">Notes</Label>
              <Textarea
                id="po-notes"
                rows={2}
                placeholder="Optional order notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Section 2: Order items ─────────────────────────────── */}
        <section className="pt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b">
            Order items
          </p>

          {/* Summary strip */}
          <div className="flex items-baseline gap-3 rounded-md bg-muted/50 px-4 py-3 mb-4">
            <span className="text-sm font-medium">
              {items.filter(i => i.product_id).length} item(s)
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-sm font-medium">
              ₱{fmt(estimatedTotal)} estimated
            </span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[2fr_140px_120px_100px_1fr_36px] gap-2 px-1 mb-2">
            <span className="text-xs text-muted-foreground">Product</span>
            <span className="text-xs text-muted-foreground">Qty</span>
            <span className="text-xs text-muted-foreground">Unit cost (₱)</span>
            <span className="text-xs text-muted-foreground">Line total</span>
            <span className="text-xs text-muted-foreground">Notes</span>
            <span />
          </div>

          {/* Item rows */}
          <div className="flex flex-col gap-2">
            {items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[2fr_140px_120px_100px_1fr_36px] gap-2 items-center"
              >
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
                <QuantityInput
                  value={item.quantity_ordered}
                  onChange={v =>
                    updateItem(i, { quantity_ordered: Math.max(1, v) })
                  }
                  min={1}
                />
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
                <div className="h-9 rounded-md border bg-muted/50 px-3 flex items-center text-sm font-medium">
                  ₱{fmt(item.quantity_ordered * item.unit_cost)}
                </div>
                <Input
                  placeholder="Optional"
                  value={item.notes}
                  onChange={e => updateItem(i, { notes: e.target.value })}
                />
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
            At least one item is required
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href="/admin/purchase-orders" />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Drafting..."
                  : "Saving..."
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
