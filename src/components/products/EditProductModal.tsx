"use client"

import { useEffect, useState, useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  updateProduct,
  generateSkuAction,
  getProductClassesForProductForm,
  getProductCategoriesForProductForm,
  getPackagingUnitsForProductForm,
  getDispensingUnitsForProductForm,
  getSuppliersForSelect,
  getManufacturersForSelect,
} from "@/app/admin/products/actions"
import type { Product } from "@/types/product"
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
import { Switch } from "@/components/ui/switch"
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
  sku: z.string().optional(),
  barcode: z.string().optional(),
  class_id: z.string().optional(),
  category_id: z.string().optional(),
  type: z.enum(["branded", "generic", "na"]),
  base_price: z.coerce.number().min(0, "Price must be 0 or more"),
  requires_prescription: z.boolean().default(false),
  supplier_id: z.string().optional(),
  manufacturer_id: z.string().optional(),
  packaging_unit_id: z.string().optional(),
  unit_count: z.coerce.number().int().min(1).default(1),
  dispensing_unit_id: z.string().optional(),
})

type FormValues = z.infer<typeof productSchema>

type SelectItem = { id: string; name: string }
type UnitItem = { id: string; name: string; abbreviation: string }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}

export function EditProductModal({ open, onOpenChange, product }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isGeneratingSku, setIsGeneratingSku] = useState(false)
  const [classes, setClasses] = useState<SelectItem[]>([])
  const [categories, setCategories] = useState<SelectItem[]>([])
  const [packagingUnits, setPackagingUnits] = useState<UnitItem[]>([])
  const [dispensingUnits, setDispensingUnits] = useState<UnitItem[]>([])
  const [suppliers, setSuppliers] = useState<SelectItem[]>([])
  const [manufacturers, setManufacturers] = useState<SelectItem[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(productSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      name: "",
      generic_name: "",
      sku: "",
      barcode: "",
      class_id: "",
      category_id: "",
      type: "na",
      base_price: 0,
      requires_prescription: false,
      supplier_id: "",
      manufacturer_id: "",
      packaging_unit_id: "",
      unit_count: 1,
      dispensing_unit_id: "",
    },
  })

  // Load static dropdown data on open
  useEffect(() => {
    if (!open) return
    Promise.all([
      getProductClassesForProductForm(),
      getPackagingUnitsForProductForm(),
      getDispensingUnitsForProductForm(),
      getSuppliersForSelect(),
      getManufacturersForSelect(),
    ])
      .then(([cls, pkg, disp, sup, man]) => {
        setClasses(cls)
        setPackagingUnits(pkg)
        setDispensingUnits(disp)
        setSuppliers(sup)
        setManufacturers(man)
      })
      .catch(() => {})
  }, [open])

  // Pre-populate form and load categories for existing class
  useEffect(() => {
    if (!product) return
    form.reset({
      name: product.name,
      generic_name: product.generic_name ?? "",
      sku: product.sku ?? "",
      barcode: product.barcode ?? "",
      class_id: product.class_id ?? "",
      category_id: product.category_id ?? "",
      type: product.type,
      base_price: product.base_price,
      requires_prescription: product.requires_prescription,
      supplier_id: product.supplier_id ?? "",
      manufacturer_id: product.manufacturer_id ?? "",
      packaging_unit_id: product.packaging_unit_id ?? "",
      unit_count: product.unit_count,
      dispensing_unit_id: product.dispensing_unit_id ?? "",
    })
    if (product.class_id) {
      getProductCategoriesForProductForm(product.class_id)
        .then(setCategories)
        .catch(() => setCategories([]))
    } else {
      setCategories([])
    }
  }, [product, form])

  // When class changes, reload categories and reset category_id
  const watchedClassId = form.watch("class_id")
  useEffect(() => {
    // Only fire when the user actively changes the class, not on initial load
    // We detect this by checking if the product's class_id matches
    if (!open) return
    if (watchedClassId === (product?.class_id ?? "")) return
    form.setValue("category_id", "")
    if (watchedClassId) {
      getProductCategoriesForProductForm(watchedClassId)
        .then(setCategories)
        .catch(() => setCategories([]))
    } else {
      setCategories([])
    }
  }, [watchedClassId, open, product?.class_id, form])

  const handleGenerateSku = async () => {
    const name = form.getValues("name")
    if (!name) {
      toast.error("Enter a product name first.")
      return
    }
    setIsGeneratingSku(true)
    try {
      const prefix = name
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 4)
        .toUpperCase()
      const result = await generateSkuAction(prefix)
      form.setValue("sku", result)
    } catch {
      toast.error("Failed to generate SKU.")
    } finally {
      setIsGeneratingSku(false)
    }
  }

  const onSubmit = (data: FormValues) => {
    if (!product) return
    startTransition(async () => {
      try {
        const cleaned = {
          ...data,
          sku: data.sku || undefined,
          barcode: data.barcode || undefined,
          class_id: data.class_id || undefined,
          category_id: data.category_id || undefined,
          supplier_id: data.supplier_id || undefined,
          manufacturer_id: data.manufacturer_id || undefined,
          packaging_unit_id: data.packaging_unit_id || undefined,
          dispensing_unit_id: data.dispensing_unit_id || undefined,
        }
        await updateProduct(product.id, cleaned)
        toast.success("Product updated.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to update product.")
      }
    })
  }

  const PRODUCT_TYPE_LABELS: Record<string, string> = {
    branded: "Branded",
    generic: "Generic",
    na: "N/A",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the details of this product.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* 1. Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-p-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-p-name"
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

          {/* 2. Generic Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-p-generic">Generic Name</Label>
            <Input
              id="edit-p-generic"
              placeholder="e.g. Paracetamol"
              {...form.register("generic_name")}
            />
          </div>

          {/* 3. SKU */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-p-sku">SKU</Label>
            <div className="flex gap-2">
              <Input
                id="edit-p-sku"
                placeholder="e.g. BIOG-001"
                className="flex-1"
                {...form.register("sku")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateSku}
                disabled={isGeneratingSku}
              >
                {isGeneratingSku ? "…" : "Generate"}
              </Button>
            </div>
          </div>

          {/* 4. Barcode */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-p-barcode">Barcode</Label>
            <Input
              id="edit-p-barcode"
              placeholder="e.g. 4800012345678"
              {...form.register("barcode")}
            />
          </div>

          {/* 5. Class */}
          <div className="flex flex-col gap-1.5">
            <Label>Class</Label>
            <Controller
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a class…">
                      {classes.find((c) => c.id === field.value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No classes found.
                      </p>
                    ) : (
                      classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* 6. Category */}
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={!watchedClassId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        watchedClassId
                          ? "Select a category…"
                          : "Select a class first…"
                      }
                    >
                      {categories.find((c) => c.id === field.value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No categories for this class.
                      </p>
                    ) : (
                      categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* 7. Type */}
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
                    <SelectValue placeholder="Select product type">
                      {PRODUCT_TYPE_LABELS[field.value]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branded">Branded</SelectItem>
                    <SelectItem value="generic">Generic</SelectItem>
                    <SelectItem value="na">N/A</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* 8. Base Price */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-p-price">
              Base Price <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">₱</span>
              <Input
                id="edit-p-price"
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

          {/* 9. Packaging Unit */}
          <div className="flex flex-col gap-1.5">
            <Label>Packaging Unit</Label>
            <Controller
              control={form.control}
              name="packaging_unit_id"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select packaging unit…">
                      {packagingUnits.find((u) => u.id === field.value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {packagingUnits.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No packaging units found.
                      </p>
                    ) : (
                      packagingUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.abbreviation})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* 10. Unit Count */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-p-unit-count">Units per Package</Label>
            <Input
              id="edit-p-unit-count"
              type="number"
              min="1"
              step="1"
              placeholder="1"
              {...form.register("unit_count")}
            />
            {form.formState.errors.unit_count && (
              <p className="text-sm text-destructive">
                {form.formState.errors.unit_count.message}
              </p>
            )}
          </div>

          {/* 11. Dispensing Unit */}
          <div className="flex flex-col gap-1.5">
            <Label>Dispensing Unit</Label>
            <Controller
              control={form.control}
              name="dispensing_unit_id"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select dispensing unit…">
                      {dispensingUnits.find((u) => u.id === field.value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {dispensingUnits.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No dispensing units found.
                      </p>
                    ) : (
                      dispensingUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.abbreviation})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* 12. Requires Prescription */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="edit-p-prescription" className="cursor-pointer">
              Requires Prescription
            </Label>
            <Controller
              control={form.control}
              name="requires_prescription"
              render={({ field }) => (
                <Switch
                  id="edit-p-prescription"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {/* 13. Supplier */}
          <div className="flex flex-col gap-1.5">
            <Label>Supplier</Label>
            <Controller
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select supplier…">
                      {suppliers.find((s) => s.id === field.value)?.name}
                    </SelectValue>
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

          {/* 14. Manufacturer */}
          <div className="flex flex-col gap-1.5">
            <Label>Manufacturer</Label>
            <Controller
              control={form.control}
              name="manufacturer_id"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select manufacturer…">
                      {manufacturers.find((m) => m.id === field.value)?.name}
                    </SelectValue>
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
