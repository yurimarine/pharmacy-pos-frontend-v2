"use client"

import { useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { updateInventoryEntry } from "@/app/admin/inventory/actions"
import type { Inventory } from "@/types/inventory"
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

const editInventorySchema = z.object({
  quantity: z.coerce.number().min(0),
  low_stock_threshold: z.coerce.number().min(0),
  markup_percentage: z.coerce.number().min(0),
  selling_price: z.coerce.number().min(0),
})

type EditInventoryFormValues = z.infer<typeof editInventorySchema>

type EditInventoryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: Inventory | null
}

export function EditInventoryModal({
  open,
  onOpenChange,
  entry,
}: EditInventoryModalProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<EditInventoryFormValues>({
    resolver: zodResolver(editInventorySchema),
    defaultValues: {
      quantity: 0,
      low_stock_threshold: 10,
      markup_percentage: 0,
      selling_price: 0,
    },
  })

  useEffect(() => {
    if (entry) {
      form.reset({
        quantity: entry.quantity,
        low_stock_threshold: entry.low_stock_threshold,
        markup_percentage: entry.markup_percentage,
        selling_price: entry.selling_price,
      })
    }
  }, [entry, form])

  const watchMarkup = form.watch("markup_percentage")

  useEffect(() => {
    if (!entry?.products?.base_price) return
    const markup = Number(watchMarkup) || 0
    const base = entry.products.base_price
    const computed = base + base * (markup / 100)
    form.setValue("selling_price", Math.round(computed * 100) / 100)
  }, [watchMarkup, entry, form])

  const onSubmit = (data: EditInventoryFormValues) => {
    if (!entry) return

    startTransition(async () => {
      try {
        await updateInventoryEntry(entry.id, data)
        toast.success("Inventory updated.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to update inventory.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Stock Entry</DialogTitle>
          <DialogDescription>
            Update stock levels for this inventory entry.
          </DialogDescription>
        </DialogHeader>

        {/* Read-only product/pharmacy info */}
        {entry && (
          <div className="flex flex-col gap-1 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <span className="font-medium">{entry.products?.name}</span>
            <span className="text-muted-foreground">
              {entry.pharmacies?.name}
            </span>
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Quantity */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-inv-quantity">Quantity</Label>
            <Input
              id="edit-inv-quantity"
              type="number"
              min="0"
              {...form.register("quantity")}
            />
          </div>

          {/* Low Stock Threshold */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-inv-threshold">Low Stock Threshold</Label>
            <Input
              id="edit-inv-threshold"
              type="number"
              min="0"
              {...form.register("low_stock_threshold")}
            />
          </div>

          {/* Markup Percentage */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-inv-markup">Markup Percentage</Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-inv-markup"
                type="number"
                step="0.01"
                min="0"
                {...form.register("markup_percentage")}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          {/* Selling Price */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-inv-price">Selling Price</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">₱</span>
              <Input
                id="edit-inv-price"
                type="number"
                step="0.01"
                min="0"
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
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
