"use client"

import { useEffect, useState, useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  createInventoryEntry,
  getActiveProductsForInventorySelect,
} from "@/app/admin/inventory/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const inventorySchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  pharmacy_id: z.string().min(1, "Pharmacy is required"),
  quantity: z.coerce.number().min(0),
  low_stock_threshold: z.coerce.number().min(0),
  markup_percentage: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0),
})

type InventoryFormValues = z.infer<typeof inventorySchema>

type AddInventoryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pharmacies: { id: string; name: string }[]
}

type ProductOption = {
  id: string
  name: string
  generic_name: string | null
  base_price: number
}

export function AddInventoryModal({
  open,
  onOpenChange,
  pharmacies,
}: AddInventoryModalProps) {
  const [isPending, startTransition] = useTransition()
  const [products, setProducts] = useState<ProductOption[]>([])

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      product_id: "",
      pharmacy_id: "",
      quantity: 0,
      low_stock_threshold: 10,
      markup_percentage: 0,
      selling_price: 0,
    },
  })

  useEffect(() => {
    if (!open) return
    getActiveProductsForInventorySelect().then(setProducts).catch(() => {})
  }, [open])

  const watchProductId = form.watch("product_id")
  const watchMarkup = form.watch("markup_percentage")

  useEffect(() => {
    const product = products.find((p) => p.id === watchProductId)
    if (!product) return
    const markup = Number(watchMarkup) || 0
    const computed = product.base_price + product.base_price * (markup / 100)
    form.setValue("selling_price", Math.round(computed * 100) / 100)
  }, [watchProductId, watchMarkup, products, form])

  const onSubmit = (data: InventoryFormValues) => {
    startTransition(async () => {
      try {
        await createInventoryEntry(data)
        toast.success("Inventory entry added.")
        onOpenChange(false)
        form.reset()
      } catch (e) {
        const msg = e instanceof Error ? e.message : ""
        if (msg.includes("already has an inventory entry")) {
          toast.error(
            "This product already has an inventory entry for this pharmacy."
          )
        } else {
          toast.error("Failed to add inventory entry.")
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Stock Entry</DialogTitle>
          <DialogDescription>
            Add a new inventory entry for a product at a pharmacy.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Product */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Product <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No products found.
                      </p>
                    ) : (
                      products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.product_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.product_id.message}
              </p>
            )}
          </div>

          {/* Pharmacy */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Pharmacy <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="pharmacy_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select pharmacy" />
                  </SelectTrigger>
                  <SelectContent>
                    {pharmacies.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No pharmacies found.
                      </p>
                    ) : (
                      pharmacies.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.pharmacy_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.pharmacy_id.message}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-inv-quantity">Quantity</Label>
            <Input
              id="add-inv-quantity"
              type="number"
              min="0"
              placeholder="0"
              {...form.register("quantity")}
            />
          </div>

          {/* Low Stock Threshold */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-inv-threshold">Low Stock Threshold</Label>
            <Input
              id="add-inv-threshold"
              type="number"
              min="0"
              placeholder="10"
              {...form.register("low_stock_threshold")}
            />
          </div>

          {/* Markup Percentage */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-inv-markup">Markup Percentage</Label>
            <div className="flex items-center gap-2">
              <Input
                id="add-inv-markup"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("markup_percentage")}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          {/* Selling Price */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-inv-price">Selling Price</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">₱</span>
              <Input
                id="add-inv-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register("selling_price")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
