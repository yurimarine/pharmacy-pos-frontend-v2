"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { createProduct, updateProduct } from "@/app/admin/products/actions";
import {
  PRODUCT_TYPE_LABELS,
  composeProductName,
  type Product,
  type ProductSuggestions,
  type ProductType,
  type ProductStatus,
} from "@/types/product";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FieldErrors = {
  generic_name?: string;
  packaging_type?: string;
  unit_count?: string;
};

type Props = {
  mode: "create" | "edit";
  product?: Product;
  suggestions: ProductSuggestions;
};

export function ProductForm({ mode, product, suggestions }: Props) {
  const isEdit = mode === "edit" && !!product;

  const [genericName, setGenericName] = useState(
    isEdit ? product.generic_name : "",
  );
  const [brandName, setBrandName] = useState(
    isEdit ? (product.brand_name ?? "") : "",
  );
  const [type, setType] = useState<ProductType>(
    isEdit ? product.type : "generic",
  );
  const [category, setCategory] = useState(
    isEdit ? (product.category ?? "") : "",
  );
  const [manufacturer, setManufacturer] = useState(
    isEdit ? (product.manufacturer ?? "") : "",
  );
  const [dosageForm, setDosageForm] = useState(
    isEdit ? (product.dosage_form ?? "") : "",
  );
  const [dosageStrength, setDosageStrength] = useState(
    isEdit ? (product.dosage_strength ?? "") : "",
  );
  const [volume, setVolume] = useState(isEdit ? (product.volume ?? "") : "");
  const [packagingType, setPackagingType] = useState(
    isEdit ? product.packaging_type : "",
  );
  const [unitCount, setUnitCount] = useState(isEdit ? product.unit_count : 1);
  const [barcode, setBarcode] = useState(isEdit ? (product.barcode ?? "") : "");
  const [unitCost, setUnitCost] = useState(isEdit ? product.unit_cost : 0);
  const [requiresPrescription, setRequiresPrescription] = useState(
    isEdit ? product.requires_prescription : false,
  );
  const [status, setStatus] = useState<ProductStatus>(
    isEdit ? product.status : "active",
  );

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const composedName = useMemo(() => {
    if (!genericName.trim()) return "";
    return composeProductName({
      generic_name: genericName,
      brand_name: brandName || null,
      dosage_strength: dosageStrength || null,
      dosage_form: dosageForm || null,
      packaging_type: packagingType,
      unit_count: unitCount,
      volume: volume || null,
    });
  }, [
    genericName,
    brandName,
    dosageStrength,
    dosageForm,
    packagingType,
    unitCount,
    volume,
  ]);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const errors: FieldErrors = {};
    if (!genericName.trim()) errors.generic_name = "This field is required";
    if (!packagingType.trim()) errors.packaging_type = "This field is required";
    if (unitCount < 1) errors.unit_count = "Min 1";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      generic_name: genericName,
      brand_name: brandName || null,
      dosage_form: dosageForm || null,
      dosage_strength: dosageStrength || null,
      volume: volume || null,
      packaging_type: packagingType,
      unit_count: unitCount,
      manufacturer: manufacturer || null,
      category: category || null,
      type,
      requires_prescription: requiresPrescription,
      unit_cost: unitCost,
      status,
      barcode: barcode || null,
    };

    const result = isEdit
      ? await updateProduct(product.id, payload)
      : await createProduct(payload);

    if (result?.error) {
      setFormError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "create" ? "Add Product" : "Edit Product"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Add a new product to the catalog."
              : `Editing ${product?.product_name ?? "product"}.`}
          </p>
        </div>
        {/* Back link */}
        <div>
          <Button
            variant="default"
            size="sm"
            render={<Link href="/admin/products" />}
            nativeButton={false}
          >
            <ChevronLeftIcon className="size-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Single container */}
      <div className="flex flex-col gap-0">
        {/* Error banner */}
        {formError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive mb-6">
            {formError}
          </div>
        )}

        {/* ── Section 1: Identity ────────────────────────────────── */}
        <section className="pb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b">
            Identity
          </p>

          <div className="flex flex-col gap-4">
            {/* Row 1: generic_name | brand_name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pf-generic_name">
                  Product/Generic name
                  <span className="text-destructive">*</span>
                </Label>
                <CreatableCombobox
                  id="pf-generic_name"
                  value={genericName}
                  onChange={v => {
                    setGenericName(v);
                    if (fieldErrors.generic_name)
                      clearFieldError("generic_name");
                  }}
                  suggestions={suggestions.genericNames}
                  placeholder="e.g. AMOXICILLIN"
                />
                {fieldErrors.generic_name && (
                  <p className="text-xs text-destructive mt-1">
                    {fieldErrors.generic_name}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pf-brand_name">Brand name</Label>
                <CreatableCombobox
                  id="pf-brand_name"
                  value={brandName}
                  onChange={setBrandName}
                  suggestions={suggestions.brandNames}
                  placeholder="e.g. AMOXIL"
                />
              </div>
            </div>

            {/* Row 2: type | category | manufacturer */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pf-type">Type</Label>
                <Select
                  value={type}
                  onValueChange={v => v && setType(v as ProductType)}
                >
                  <SelectTrigger id="pf-type">
                    <SelectValue>{PRODUCT_TYPE_LABELS[type]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(PRODUCT_TYPE_LABELS) as [
                        ProductType,
                        string,
                      ][]
                    ).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pf-category">Category</Label>
                <CreatableCombobox
                  id="pf-category"
                  value={category}
                  onChange={setCategory}
                  suggestions={suggestions.categories}
                  placeholder="e.g. ANTIBIOTIC"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pf-manufacturer">Manufacturer</Label>
                <CreatableCombobox
                  id="pf-manufacturer"
                  value={manufacturer}
                  onChange={setManufacturer}
                  suggestions={suggestions.manufacturers}
                  placeholder="e.g. UNILAB"
                />
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Section 2: Pharmaceutical details ─────────────────── */}
        <section className="py-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b">
            Pharmaceutical details
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-dosage_form">Dosage form</Label>
              <CreatableCombobox
                id="pf-dosage_form"
                value={dosageForm}
                onChange={setDosageForm}
                suggestions={suggestions.dosageForms}
                placeholder="e.g. TABLET"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-dosage_strength">Dosage strength</Label>
              <CreatableCombobox
                id="pf-dosage_strength"
                value={dosageStrength}
                onChange={setDosageStrength}
                suggestions={suggestions.dosageStrengths}
                placeholder="e.g. 500MG, 250MG/5ML"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-volume">Volume / size</Label>
              <CreatableCombobox
                id="pf-volume"
                value={volume}
                onChange={setVolume}
                suggestions={suggestions.volumes}
                placeholder="e.g. 60ML, LARGE"
              />
              <p className="text-xs text-muted-foreground">
                For liquid products only
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Section 3: Packaging ───────────────────────────────── */}
        <section className="py-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b">
            Packaging
          </p>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-packaging_type">
                Packaging type <span className="text-destructive">*</span>
              </Label>
              <CreatableCombobox
                id="pf-packaging_type"
                value={packagingType}
                onChange={v => {
                  setPackagingType(v);
                  if (fieldErrors.packaging_type)
                    clearFieldError("packaging_type");
                }}
                suggestions={suggestions.packagingTypes}
                placeholder="e.g. BOX"
              />
              {fieldErrors.packaging_type && (
                <p className="text-xs text-destructive mt-1">
                  {fieldErrors.packaging_type}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-unit_count">
                Units per pack <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pf-unit_count"
                type="number"
                min={1}
                value={unitCount}
                onChange={evt => {
                  const v = Math.max(1, parseInt(evt.target.value) || 1);
                  setUnitCount(v);
                  if (fieldErrors.unit_count) clearFieldError("unit_count");
                }}
              />
              <p className="text-xs text-muted-foreground">
                Set to 1 for PCS, VIAL, single units
              </p>
              {fieldErrors.unit_count && (
                <p className="text-xs text-destructive mt-1">
                  {fieldErrors.unit_count}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-barcode">Barcode</Label>
              <Input
                id="pf-barcode"
                value={barcode}
                onChange={evt => setBarcode(evt.target.value)}
                placeholder="EAN-13 (optional)"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>SKU</Label>
              {mode === "create" ? (
                <div className="h-9 rounded-md border bg-muted px-3 flex items-center text-sm text-muted-foreground">
                  Auto-generated
                </div>
              ) : (
                <div className="h-9 rounded-md border bg-muted px-3 flex items-center text-sm font-mono">
                  {product?.sku}
                </div>
              )}
            </div>
          </div>

          {/* Product name preview */}
          <div className="flex items-baseline gap-3 rounded-md bg-muted/50 px-4 py-3 mt-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Product name preview →
            </span>
            <span className="text-sm font-medium">
              {composedName || (
                <span className="text-muted-foreground italic">
                  Fill in generic name and packaging to preview
                </span>
              )}
            </span>
          </div>
        </section>

        <Separator />

        {/* ── Section 4: Pricing & compliance ───────────────────── */}
        <section className="pt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b">
            Pricing &amp; compliance
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pf-unit_cost">Unit cost (₱)</Label>
              <Input
                id="pf-unit_cost"
                type="number"
                min={0}
                step={0.01}
                value={unitCost}
                onChange={evt => setUnitCost(parseFloat(evt.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Base cost — used for markup computation
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Prescription requirement</Label>
              <div
                className="flex items-center gap-2 h-9 rounded-md border px-3 cursor-pointer"
                onClick={() => setRequiresPrescription(v => !v)}
              >
                <Checkbox
                  checked={requiresPrescription}
                  onCheckedChange={checked =>
                    setRequiresPrescription(Boolean(checked))
                  }
                />
                <span className="text-sm">Requires prescription (Rx)</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              {mode === "create" ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={status === "active" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setStatus("active")}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={status === "inactive" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setStatus("inactive")}
                  >
                    Inactive
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={status === "active" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setStatus("active")}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={status === "inactive" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setStatus("inactive")}
                  >
                    Inactive
                  </Button>
                  <Button
                    type="button"
                    variant={
                      status === "discontinued" ? "destructive" : "outline"
                    }
                    size="sm"
                    className="flex-1"
                    onClick={() => setStatus("discontinued")}
                  >
                    Discontinued
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="border-t pt-6 mt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Fields marked{" "}
            <span className="text-destructive font-medium">*</span> are required
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href="/admin/products" />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? mode === "create"
                  ? "Creating…"
                  : "Saving…"
                : mode === "create"
                  ? "Create product"
                  : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
