"use client";

import { useState, useEffect, useTransition } from "react";
import { XIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { updatePurchaseOrder } from "@/app/admin/purchase-orders/actions";
import { getProducts } from "@/app/admin/products/actions";
import type { PurchaseOrderWithItems } from "@/types/inventory";
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

type Supplier = { id: string; name: string };

type ItemRow = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  notes: string;
};

function emptyRow(): ItemRow {
  return {
    product_id: "",
    product_name: "",
    quantity: 1,
    unit_cost: 0,
    notes: "",
  };
}

export default function EditPurchaseOrderModal({
  open,
  onOpenChange,
  po,
  suppliers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: PurchaseOrderWithItems | null;
  suppliers: Supplier[];
}) {
  const [supplierId, setSupplierId] = useState<string>(po?.supplier_id ?? "");
  const [deliveryDate, setDeliveryDate] = useState<string>(
    po?.expected_delivery_date ?? "",
  );
  const [notes, setNotes] = useState<string>(po?.notes ?? "");
  const [items, setItems] = useState<ItemRow[]>(
    po?.items?.length
      ? po.items.map(item => ({
          product_id: item.product_id,
          product_name: item.products?.product_name ?? "",
          quantity: item.quantity_ordered,
          unit_cost: item.unit_cost,
          notes: item.notes ?? "",
        }))
      : [emptyRow()],
  );
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isPending, startTransition] = useTransition();

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

  const updateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems(prev =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const estimatedTotal = items.reduce(
    (sum, row) => sum + row.quantity * row.unit_cost,
    0,
  );

  const handleSubmit = () => {
    if (!po) return;
    const validItems = items.filter(row => row.product_id !== "");
    if (validItems.length === 0) {
      setItemsError("At least one item with a selected product is required.");
      return;
    }
    setItemsError(null);

    startTransition(async () => {
      const result = await updatePurchaseOrder(po.id, {
        supplier_id: supplierId || null,
        expected_delivery_date: deliveryDate || null,
        notes: notes.trim() || null,
        items: validItems.map(row => ({
          product_id: row.product_id,
          quantity_ordered: row.quantity,
          unit_cost: row.unit_cost,
          notes: row.notes.trim() || null,
        })),
      });

      if (result.success) {
        toast.success("Purchase order updated.");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Failed to update purchase order.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col max-h-[90vh] sm:max-w-3xl md:max-w-6xl p-0"
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-0">
          <DialogTitle>Edit Purchase Order</DialogTitle>
          <DialogDescription>
            Update this draft purchase order.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* PO Number (read-only) */}
          {po && (
            <div className="flex flex-col gap-1.5 mb-5">
              <Label className="text-xs text-muted-foreground">PO Number</Label>
              <div className="font-mono bg-muted px-3 py-2 rounded-md text-lg">
                {po.po_number}
              </div>
            </div>
          )}

          {/* Header fields */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-po-supplier">Supplier</Label>
              <Select
                value={supplierId}
                onValueChange={v => v !== null && setSupplierId(v)}
              >
                <SelectTrigger id="edit-po-supplier">
                  <SelectValue>
                    {supplierId
                      ? (suppliers.find(s => s.id === supplierId)?.name ??
                        "No Supplier")
                      : "No Supplier"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Supplier</SelectItem>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-po-delivery">Expected Delivery Date</Label>
              <Input
                id="edit-po-delivery"
                type="date"
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="edit-po-notes">Notes</Label>
              <Textarea
                id="edit-po-notes"
                placeholder="Optional notes…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Line items */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-semibold">Order Items</Label>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_110px_140px_32px] gap-2 px-1">
              <span className="text-xs text-muted-foreground">Product</span>
              <span className="text-xs text-muted-foreground">Qty</span>
              <span className="text-xs text-muted-foreground">
                Unit Cost (₱)
              </span>
              <span className="text-xs text-muted-foreground">Note</span>
              <span />
            </div>

            {items.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_80px_110px_140px_32px] gap-2 items-center"
              >
                <ProductCombobox
                  options={products}
                  value={row.product_id}
                  onChange={p => {
                    updateItem(i, {
                      product_id: p?.id ?? "",
                      product_name: p?.name ?? "",
                      unit_cost: p ? p.base_price : 0,
                    });
                  }}
                  placeholder="Search product…"
                />
                <Input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={e =>
                    updateItem(i, {
                      quantity: Math.max(1, Number(e.target.value)),
                    })
                  }
                />
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={row.unit_cost}
                  onChange={e =>
                    updateItem(i, { unit_cost: Number(e.target.value) })
                  }
                  placeholder="0.00"
                />
                <Input
                  type="text"
                  value={row.notes}
                  onChange={e => updateItem(i, { notes: e.target.value })}
                  placeholder="Optional note"
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
              <span>
                Total Items:{" "}
                <span className="font-medium text-foreground">
                  {items.filter(r => r.product_id).length}
                </span>
              </span>
              <span>|</span>
              <span>
                Estimated Cost:{" "}
                <span className="font-medium text-foreground">
                  ₱
                  {estimatedTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 px-6 pb-6 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
