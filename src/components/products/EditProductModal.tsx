"use client"

import { useState, useEffect, useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { updateProduct, getProductSuggestions } from "@/app/admin/products/actions"
import {
  PRODUCT_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
} from "@/types/product"
import type { Product, ProductSuggestions } from "@/types/product"
import { CreatableCombobox } from "@/components/ui/creatable-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMPTY_SUGGESTIONS: ProductSuggestions = {
  genericNames: [],
  brandNames: [],
  dosageForms: [],
  dosageStrengths: [],
  volumes: [],
  packagingTypes: [],
  categories: [],
  manufacturers: [],
}

const schema = z.object({
  generic_name: z.string().min(1, "Required"),
  brand_name: z.string(),
  dosage_form: z.string(),
  dosage_strength: z.string(),
  volume: z.string(),
  packaging_type: z.string().min(1, "Required"),
  unit_count: z.number().int().min(1, "Min 1"),
  manufacturer: z.string(),
  category: z.string(),
  type: z.enum(["generic", "branded", "otc"]),
  requires_prescription: z.boolean(),
  unit_cost: z.number().min(0, "Must be ≥ 0"),
  status: z.enum(["active", "inactive", "discontinued"]),
  barcode: z.string(),
})

type FormValues = z.infer<typeof schema>

function productToFormValues(product: Product): FormValues {
  return {
    generic_name: product.generic_name,
    brand_name: product.brand_name ?? "",
    dosage_form: product.dosage_form ?? "",
    dosage_strength: product.dosage_strength ?? "",
    volume: product.volume ?? "",
    packaging_type: product.packaging_type,
    unit_count: product.unit_count,
    manufacturer: product.manufacturer ?? "",
    category: product.category ?? "",
    type: product.type,
    requires_prescription: product.requires_prescription,
    unit_cost: product.unit_cost,
    status: product.status,
    barcode: product.barcode ?? "",
  }
}

export default function EditProductModal({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
}) {
  const [suggestions, setSuggestions] = useState<ProductSuggestions>(EMPTY_SUGGESTIONS)
  const [isPending, startTransition] = useTransition()

  const { control, register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: product ? productToFormValues(product) : undefined,
  })

  useEffect(() => {
    getProductSuggestions().then(setSuggestions).catch(() => {})
  }, [])

  const onSubmit = (values: FormValues) => {
    if (!product) return
    startTransition(async () => {
      const result = await updateProduct(product.id, {
        generic_name: values.generic_name,
        brand_name: values.brand_name || null,
        dosage_form: values.dosage_form || null,
        dosage_strength: values.dosage_strength || null,
        volume: values.volume || null,
        packaging_type: values.packaging_type,
        unit_count: values.unit_count,
        manufacturer: values.manufacturer || null,
        category: values.category || null,
        type: values.type,
        requires_prescription: values.requires_prescription,
        unit_cost: values.unit_cost,
        status: values.status,
        barcode: values.barcode || null,
      })
      if (result.success) {
        toast.success("Product updated successfully.")
        onOpenChange(false)
      } else {
        toast.error(result.error ?? "Failed to update product.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product details below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <form id="edit-product-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 py-4">
            {/* Drug Identification */}
            <fieldset className="flex flex-col gap-3">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Drug Identification
              </legend>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-generic_name">
                  Generic Name <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}
                  name="generic_name"
                  render={({ field }) => (
                    <CreatableCombobox
                      id="edit-generic_name"
                      value={field.value}
                      onChange={field.onChange}
                      suggestions={suggestions.genericNames}
                      placeholder="e.g. AMOXICILLIN"
                    />
                  )}
                />
                {errors.generic_name && (
                  <p className="text-sm text-destructive">{errors.generic_name.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-brand_name">Brand Name</Label>
                <Controller
                  control={control}
                  name="brand_name"
                  render={({ field }) => (
                    <CreatableCombobox
                      id="edit-brand_name"
                      value={field.value}
                      onChange={field.onChange}
                      suggestions={suggestions.brandNames}
                      placeholder="e.g. AMOXIL"
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-dosage_form">Dosage Form</Label>
                  <Controller
                    control={control}
                    name="dosage_form"
                    render={({ field }) => (
                      <CreatableCombobox
                        id="edit-dosage_form"
                        value={field.value}
                        onChange={field.onChange}
                        suggestions={suggestions.dosageForms}
                        placeholder="e.g. TABLET"
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-dosage_strength">Dosage Strength</Label>
                  <Controller
                    control={control}
                    name="dosage_strength"
                    render={({ field }) => (
                      <CreatableCombobox
                        id="edit-dosage_strength"
                        value={field.value}
                        onChange={field.onChange}
                        suggestions={suggestions.dosageStrengths}
                        placeholder="e.g. 500MG"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-volume">Volume</Label>
                <Controller
                  control={control}
                  name="volume"
                  render={({ field }) => (
                    <CreatableCombobox
                      id="edit-volume"
                      value={field.value}
                      onChange={field.onChange}
                      suggestions={suggestions.volumes}
                      placeholder="e.g. 60ML"
                    />
                  )}
                />
              </div>
            </fieldset>

            {/* Packaging */}
            <fieldset className="flex flex-col gap-3">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Packaging
              </legend>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-packaging_type">
                    Packaging Type <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="packaging_type"
                    render={({ field }) => (
                      <CreatableCombobox
                        id="edit-packaging_type"
                        value={field.value}
                        onChange={field.onChange}
                        suggestions={suggestions.packagingTypes}
                        placeholder="e.g. BOX"
                      />
                    )}
                  />
                  {errors.packaging_type && (
                    <p className="text-sm text-destructive">{errors.packaging_type.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-unit_count">Units per Pack</Label>
                  <Input
                    id="edit-unit_count"
                    type="number"
                    min={1}
                    {...register("unit_count", { valueAsNumber: true })}
                  />
                  {errors.unit_count && (
                    <p className="text-sm text-destructive">{errors.unit_count.message}</p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Classification */}
            <fieldset className="flex flex-col gap-3">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Classification
              </legend>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-type">Type</Label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={v => v && field.onChange(v)}>
                        <SelectTrigger id="edit-type">
                          <SelectValue>{PRODUCT_TYPE_LABELS[field.value]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(PRODUCT_TYPE_LABELS) as [string, string][]).map(
                            ([val, label]) => (
                              <SelectItem key={val} value={val}>{label}</SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-category">Category</Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <CreatableCombobox
                        id="edit-category"
                        value={field.value}
                        onChange={field.onChange}
                        suggestions={suggestions.categories}
                        placeholder="e.g. ANTIBIOTIC"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                <Controller
                  control={control}
                  name="manufacturer"
                  render={({ field }) => (
                    <CreatableCombobox
                      id="edit-manufacturer"
                      value={field.value}
                      onChange={field.onChange}
                      suggestions={suggestions.manufacturers}
                      placeholder="e.g. UNILAB"
                    />
                  )}
                />
              </div>

              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="requires_prescription"
                  render={({ field }) => (
                    <Checkbox
                      id="edit-requires_prescription"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="edit-requires_prescription">Requires prescription (Rx)</Label>
              </div>
            </fieldset>

            {/* Pricing & Status */}
            <fieldset className="flex flex-col gap-3">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Pricing &amp; Status
              </legend>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-unit_cost">Unit Cost (₱)</Label>
                  <Input
                    id="edit-unit_cost"
                    type="number"
                    min={0}
                    step={0.01}
                    {...register("unit_cost", { valueAsNumber: true })}
                  />
                  {errors.unit_cost && (
                    <p className="text-sm text-destructive">{errors.unit_cost.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-status">Status</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={v => v && field.onChange(v)}>
                        <SelectTrigger id="edit-status">
                          <SelectValue>{PRODUCT_STATUS_LABELS[field.value]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(PRODUCT_STATUS_LABELS) as [string, string][]).map(
                            ([val, label]) => (
                              <SelectItem key={val} value={val}>{label}</SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-barcode">Barcode</Label>
                <Input
                  id="edit-barcode"
                  placeholder="e.g. 4800888123456"
                  {...register("barcode")}
                />
              </div>
            </fieldset>
          </form>
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
          <Button type="submit" form="edit-product-form" disabled={isPending}>
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
