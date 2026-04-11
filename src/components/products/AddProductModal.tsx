"use client"

import { useEffect, useState, useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  createProduct,
  getSuppliersForSelect,
  getManufacturersForSelect,
} from "@/app/admin/products/actions"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  generic_name: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(["branded", "generic"]),
  base_price: z.coerce.number().min(0, "Price must be 0 or more"),
  requires_prescription: z.boolean().default(false),
  supplier_id: z.string().optional(),
  manufacturer_id: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

type AddProductModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddProductModal({ open, onOpenChange }: AddProductModalProps) {
  const [isPending, startTransition] = useTransition()
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [manufacturers, setManufacturers] = useState<
    { id: string; name: string }[]
  >([])

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      generic_name: "",
      category: "",
      type: "generic",
      base_price: 0,
      requires_prescription: false,
      supplier_id: "",
      manufacturer_id: "",
    },
  })

  useEffect(() => {
    if (!open) return
    getSuppliersForSelect().then(setSuppliers).catch(() => {})
    getManufacturersForSelect().then(setManufacturers).catch(() => {})
  }, [open])

  const onSubmit = (data: ProductFormValues) => {
    startTransition(async () => {
      try {
        await createProduct({
          name: data.name,
          generic_name: data.generic_name,
          category: data.category,
          type: data.type,
          base_price: data.base_price,
          requires_prescription: data.requires_prescription,
          supplier_id: data.supplier_id,
          manufacturer_id: data.manufacturer_id,
        })
        toast.success("Product added successfully.")
        onOpenChange(false)
        form.reset()
      } catch {
        toast.error("Failed to add product.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new product.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-product-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="add-product-name"
              placeholder="e.g. Biogesic 500mg"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Generic Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-product-generic">Generic Name</Label>
            <Input
              id="add-product-generic"
              placeholder="e.g. Paracetamol"
              {...form.register("generic_name")}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-product-category">Category</Label>
            <Input
              id="add-product-category"
              placeholder="e.g. Analgesic"
              {...form.register("category")}
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Type <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branded">Branded</SelectItem>
                    <SelectItem value="generic">Generic</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Base Price */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-product-price">
              Base Price <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">₱</span>
              <Input
                id="add-product-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                aria-invalid={!!form.formState.errors.base_price}
                {...form.register("base_price")}
              />
            </div>
            {form.formState.errors.base_price && (
              <p className="text-sm text-destructive">
                {form.formState.errors.base_price.message}
              </p>
            )}
          </div>

          {/* Supplier */}
          <div className="flex flex-col gap-1.5">
            <Label>Supplier</Label>
            <Controller
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No suppliers found.
                      </p>
                    ) : (
                      suppliers.map((s) => (
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
            <Label>Manufacturer</Label>
            <Controller
              control={form.control}
              name="manufacturer_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select manufacturer" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No manufacturers found.
                      </p>
                    ) : (
                      manufacturers.map((m) => (
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

          {/* Requires Prescription */}
          <div className="flex items-center gap-2">
            <Controller
              control={form.control}
              name="requires_prescription"
              render={({ field }) => (
                <Checkbox
                  id="add-product-prescription"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="add-product-prescription" className="cursor-pointer">
              Requires Prescription
            </Label>
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
              {isPending ? "Saving…" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
