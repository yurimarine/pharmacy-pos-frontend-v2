"use client";

import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { addBatchItem } from "@/app/admin/batches/actions";
import type { BatchWithItems, BatchItem, StockOutReason } from "@/types/batch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";

type Product = {
  id: string;
  name: string;
  generic_name: string | null;
  base_price: number;
  current_quantity?: number;
};

type Supplier = { id: string; name: string };
type Manufacturer = { id: string; name: string };

type AddBatchItemModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: BatchWithItems;
  products: Product[];
  suppliers: Supplier[];
  manufacturers: Manufacturer[];
  onAdded: (item: BatchItem) => void;
};

const stockInSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  supplier_id: z.string().optional(),
  manufacturer_id: z.string().optional(),
  quantity: z.preprocess(
    v => Number(v),
    z.number().int().min(1, "Quantity must be at least 1"),
  ),
  unit_cost: z.preprocess(
    v => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().min(0, "Unit cost cannot be negative").optional(),
  ),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
});

const priceChangeSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  new_price: z.preprocess(
    v => Number(v),
    z.number().min(0, "Price cannot be negative"),
  ),
  notes: z.string().optional(),
});

type PriceChangeFormValues = z.infer<typeof priceChangeSchema>;

const stockOutSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.preprocess(
    v => Number(v),
    z.number().int().min(1, "Quantity must be at least 1"),
  ),
  reason: z.enum([
    "damaged",
    "expired",
    "returned",
    "adjustment",
    "transferred",
  ]),
  notes: z.string().optional(),
});

type StockInFormValues = z.infer<typeof stockInSchema>;
type StockOutFormValues = z.infer<typeof stockOutSchema>;

const STOCK_OUT_REASONS: { value: StockOutReason; label: string }[] = [
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "returned", label: "Returned" },
  { value: "adjustment", label: "Adjustment" },
  { value: "transferred", label: "Transferred" },
];

export function AddBatchItemModal({
  open,
  onOpenChange,
  batch,
  products,
  suppliers,
  manufacturers,
  onAdded,
}: AddBatchItemModalProps) {
  const [isPending, startTransition] = useTransition();
  const isStockIn = batch.type === "stock_in";
  const isPriceChange = batch.type === "price_change";

  const stockInForm = useForm<StockInFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(stockInSchema) as any,
    defaultValues: {
      product_id: "",
      supplier_id: "",
      manufacturer_id: "",
      quantity: 1,
      unit_cost: undefined,
      expiry_date: "",
      notes: "",
    },
  });

  const stockOutForm = useForm<StockOutFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(stockOutSchema) as any,
    defaultValues: {
      product_id: "",
      quantity: 1,
      reason: undefined,
      notes: "",
    },
  });

  const priceChangeForm = useForm<PriceChangeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(priceChangeSchema) as any,
    defaultValues: {
      product_id: "",
      new_price: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      stockInForm.reset();
      stockOutForm.reset();
      priceChangeForm.reset();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProductIdIn = stockInForm.watch("product_id");
  const selectedProductIdOut = stockOutForm.watch("product_id");
  const selectedProductIdChange = priceChangeForm.watch("product_id");

  // Auto-fill unit_cost with base_price on stock_in
  useEffect(() => {
    if (!isStockIn || !selectedProductIdIn) return;
    const product = products.find(p => p.id === selectedProductIdIn);
    if (product) {
      stockInForm.setValue("unit_cost", product.base_price);
    }
  }, [selectedProductIdIn, isStockIn, products]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill new_price with current base_price on price_change
  useEffect(() => {
    if (!isPriceChange || !selectedProductIdChange) return;
    const product = products.find(p => p.id === selectedProductIdChange);
    if (product) {
      priceChangeForm.setValue("new_price", product.base_price);
    }
  }, [selectedProductIdChange, isPriceChange, products]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProductOut = products.find(p => p.id === selectedProductIdOut);
  const quantityOut = stockOutForm.watch("quantity");
  const selectedProductChange = products.find(p => p.id === selectedProductIdChange);

  const handleSubmitStockIn = (values: StockInFormValues) => {
    startTransition(async () => {
      try {
        const item = await addBatchItem({
          batch_id: batch.id,
          product_id: values.product_id,
          supplier_id: values.supplier_id || undefined,
          manufacturer_id: values.manufacturer_id || undefined,
          quantity: values.quantity,
          unit_cost: values.unit_cost,
          expiry_date: values.expiry_date || undefined,
          notes: values.notes || undefined,
        });
        toast.success("Item added to batch.");
        onAdded(item);
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add item.");
      }
    });
  };

  const handleSubmitStockOut = (values: StockOutFormValues) => {
    // Validate against current_quantity
    const product = products.find(p => p.id === values.product_id);
    if (
      product?.current_quantity !== undefined &&
      values.quantity > product.current_quantity
    ) {
      stockOutForm.setError("quantity", {
        message: `Only ${product.current_quantity} units available in stock.`,
      });
      return;
    }

    startTransition(async () => {
      try {
        const item = await addBatchItem({
          batch_id: batch.id,
          product_id: values.product_id,
          quantity: values.quantity,
          reason: values.reason,
          notes: values.notes || undefined,
        });
        toast.success("Item added to batch.");
        onAdded(item);
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add item.");
      }
    });
  };

  const handleSubmitPriceChange = (values: PriceChangeFormValues) => {
    startTransition(async () => {
      try {
        const item = await addBatchItem({
          batch_id: batch.id,
          product_id: values.product_id,
          quantity: 1, // not used for price_change finalization
          unit_cost: values.new_price,
          notes: values.notes || undefined,
        });
        toast.success("Item added to batch.");
        onAdded(item);
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add item.");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={val => {
        if (!isPending) onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
          <DialogDescription>
            Add a product to batch{" "}
            <span className="font-medium text-foreground">
              {batch.batch_number}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {isPriceChange ? (
          <form
            id="add-item-form"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSubmit={priceChangeForm.handleSubmit(handleSubmitPriceChange as any)}
            className="flex flex-col gap-4"
          >
            {/* Product */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pc_product_id">Product *</Label>
              <Controller
                control={priceChangeForm.control}
                name="product_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="pc_product_id" className="w-full">
                      <SelectValue placeholder="Select product">
                        {products.find(p => p.id === field.value)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {products.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No products available
                        </div>
                      ) : (
                        products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                            {p.generic_name ? ` (${p.generic_name})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {priceChangeForm.formState.errors.product_id && (
                <p className="text-sm text-destructive">
                  {priceChangeForm.formState.errors.product_id.message}
                </p>
              )}
            </div>

            {/* Current base price hint */}
            {selectedProductChange && (
              <p className="text-sm text-muted-foreground -mt-2">
                Current base price: ₱{Number(selectedProductChange.base_price).toFixed(2)}
              </p>
            )}

            {/* New Price */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pc_new_price">New Base Price (₱) *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">₱</span>
                <Input
                  id="pc_new_price"
                  type="number"
                  step="0.01"
                  min={0}
                  {...priceChangeForm.register("new_price")}
                />
              </div>
              {priceChangeForm.formState.errors.new_price && (
                <p className="text-sm text-destructive">
                  {priceChangeForm.formState.errors.new_price.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pc_notes">Notes</Label>
              <Textarea
                id="pc_notes"
                placeholder="Optional notes…"
                {...priceChangeForm.register("notes")}
              />
            </div>
          </form>
        ) : isStockIn ? (
          <form
            id="add-item-form"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSubmit={stockInForm.handleSubmit(handleSubmitStockIn as any)}
            className="flex flex-col gap-4"
          >
            {/* Product */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product_id">Product *</Label>
              <Controller
                control={stockInForm.control}
                name="product_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="product_id" className={"w-full"}>
                      <SelectValue placeholder="Select product">
                        {products.find(p => p.id === field.value)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className={"w-full"}>
                      {products.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No products available
                        </div>
                      ) : (
                        products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                            {p.generic_name ? ` (${p.generic_name})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {stockInForm.formState.errors.product_id && (
                <p className="text-sm text-destructive">
                  {stockInForm.formState.errors.product_id.message}
                </p>
              )}
            </div>

            {/* Quantity + Unit Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  {...stockInForm.register("quantity")}
                />
                {stockInForm.formState.errors.quantity && (
                  <p className="text-sm text-destructive">
                    {stockInForm.formState.errors.quantity.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="unit_cost">Unit Cost (₱)</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  min={0}
                  {...stockInForm.register("unit_cost")}
                />
                {stockInForm.formState.errors.unit_cost && (
                  <p className="text-sm text-destructive">
                    {stockInForm.formState.errors.unit_cost.message}
                  </p>
                )}
              </div>
            </div>

            {/* Expiry Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                {...stockInForm.register("expiry_date")}
              />
            </div>

            {/* Supplier */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="supplier_id">Supplier</Label>
              <Controller
                control={stockInForm.control}
                name="supplier_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="supplier_id">
                      <SelectValue placeholder="Select supplier">
                        {suppliers.find(s => s.id === field.value)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No suppliers available
                        </div>
                      ) : (
                        suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Manufacturer */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="manufacturer_id">Manufacturer</Label>
              <Controller
                control={stockInForm.control}
                name="manufacturer_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="manufacturer_id">
                      <SelectValue placeholder="Select manufacturer">
                        {manufacturers.find(m => m.id === field.value)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No manufacturers available
                        </div>
                      ) : (
                        manufacturers.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional notes…"
                {...stockInForm.register("notes")}
              />
            </div>
          </form>
        ) : (
          <form
            id="add-item-form"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSubmit={stockOutForm.handleSubmit(handleSubmitStockOut as any)}
            className="flex flex-col gap-4"
          >
            {/* Product */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product_id_out">Product *</Label>
              <Controller
                control={stockOutForm.control}
                name="product_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="product_id_out" className={"w-full"}>
                      <SelectValue placeholder="Select product">
                        {products.find(p => p.id === field.value)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className={"w-full"}>
                      {products.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No products with inventory at this pharmacy
                        </div>
                      ) : (
                        products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                            {p.current_quantity !== undefined
                              ? ` — ${p.current_quantity} in stock`
                              : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {stockOutForm.formState.errors.product_id && (
                <p className="text-sm text-destructive">
                  {stockOutForm.formState.errors.product_id.message}
                </p>
              )}
            </div>

            {/* Current stock hint */}
            {selectedProductOut &&
              selectedProductOut.current_quantity !== undefined && (
                <p className="text-sm text-muted-foreground -mt-2">
                  Current stock: {selectedProductOut.current_quantity} units
                </p>
              )}

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quantity_out">Quantity *</Label>
              <Input
                id="quantity_out"
                type="number"
                min={1}
                max={selectedProductOut?.current_quantity ?? undefined}
                {...stockOutForm.register("quantity")}
              />
              {stockOutForm.formState.errors.quantity && (
                <p className="text-sm text-destructive">
                  {stockOutForm.formState.errors.quantity.message}
                </p>
              )}
              {selectedProductOut?.current_quantity !== undefined &&
                quantityOut > selectedProductOut.current_quantity && (
                  <p className="text-sm text-destructive">
                    Only {selectedProductOut.current_quantity} units available.
                  </p>
                )}
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reason">Reason *</Label>
              <Controller
                control={stockOutForm.control}
                name="reason"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="reason">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {STOCK_OUT_REASONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {stockOutForm.formState.errors.reason && (
                <p className="text-sm text-destructive">
                  {stockOutForm.formState.errors.reason.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes_out">Notes</Label>
              <Textarea
                id="notes_out"
                placeholder="Optional notes…"
                {...stockOutForm.register("notes")}
              />
            </div>
          </form>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-item-form" disabled={isPending}>
            {isPending ? "Adding…" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
