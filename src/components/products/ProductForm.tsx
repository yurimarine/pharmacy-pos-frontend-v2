"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, XIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
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
import { QuantityInput } from "@/components/ui/QuantityInput";
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

type Variant = {
  id: string;
  packagingType: string;
  unitCount: number;
  barcode: string;
  unitCost: number;
  requiresPrescription: boolean;
  status: ProductStatus;
};

type VariantErrors = {
  packagingType?: string;
  unitCount?: string;
};

type FieldErrors = {
  generic_name?: string;
  packaging_type?: string;
  unit_count?: string;
  variants: Record<string, VariantErrors>;
};

type Props = {
  mode: "create" | "edit";
  product?: Product;
  suggestions: ProductSuggestions;
};

export function ProductForm({ mode, product, suggestions }: Props) {
  const isEdit = mode === "edit" && !!product;
  const router = useRouter();

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

  // Edit mode individual states
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

  // Create mode variants
  const [variants, setVariants] = useState<Variant[]>([
    {
      id: crypto.randomUUID(),
      packagingType: "",
      unitCount: 1,
      barcode: "",
      unitCost: 0,
      requiresPrescription: false,
      status: "active",
    },
  ]);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ variants: {} });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit mode composed name
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

  const clearFieldError = (
    field: keyof Omit<FieldErrors, "variants">,
  ) => {
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const addVariant = () =>
    setVariants(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        packagingType: "",
        unitCount: 1,
        barcode: "",
        unitCost: 0,
        requiresPrescription: false,
        status: "active",
      },
    ]);

  const removeVariant = (id: string) => {
    if (variants.length === 1) return;
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof Variant, value: unknown) =>
    setVariants(prev =>
      prev.map(v => (v.id === id ? { ...v, [field]: value } : v)),
    );

  const clearVariantError = (id: string, field: keyof VariantErrors) => {
    setFieldErrors(prev => ({
      ...prev,
      variants: {
        ...prev.variants,
        [id]: { ...prev.variants[id], [field]: undefined },
      },
    }));
  };

  const handleSubmit = async () => {
    if (isEdit) {
      const errors: FieldErrors = { variants: {} };
      if (!genericName.trim()) errors.generic_name = "This field is required";
      if (!packagingType.trim())
        errors.packaging_type = "This field is required";
      if (unitCount < 1) errors.unit_count = "Min 1";
      if (errors.generic_name || errors.packaging_type || errors.unit_count) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({ variants: {} });
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

      const result = await updateProduct(product!.id, payload);
      if (result?.error) {
        setFormError(result.error);
        setIsSubmitting(false);
      }
      // updateProduct redirects server-side on success
      return;
    }

    // Create mode
    const errors: FieldErrors = { variants: {} };
    if (!genericName.trim()) errors.generic_name = "This field is required";

    variants.forEach(v => {
      const ve: VariantErrors = {};
      if (!v.packagingType.trim()) ve.packagingType = "This field is required";
      if (v.unitCount < 1) ve.unitCount = "Min 1";
      if (Object.keys(ve).length > 0) errors.variants[v.id] = ve;
    });

    if (errors.generic_name || Object.keys(errors.variants).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({ variants: {} });
    setFormError(null);
    setIsSubmitting(true);

    for (const variant of variants) {
      const payload = {
        generic_name: genericName,
        brand_name: brandName || null,
        dosage_form: dosageForm || null,
        dosage_strength: dosageStrength || null,
        volume: volume || null,
        packaging_type: variant.packagingType,
        unit_count: variant.unitCount,
        manufacturer: manufacturer || null,
        category: category || null,
        type,
        requires_prescription: variant.requiresPrescription,
        unit_cost: variant.unitCost,
        status: variant.status,
        barcode: variant.barcode || null,
      };
      const result = await createProduct(payload);
      if (result?.error) {
        setFormError(result.error);
        setIsSubmitting(false);
        return;
      }
    }

    toast.success(
      `${variants.length} product${variants.length > 1 ? "s" : ""} created successfully.`,
    );
    setVariants([
      {
        id: crypto.randomUUID(),
        packagingType: "",
        unitCount: 1,
        barcode: "",
        unitCost: 0,
        requiresPrescription: false,
        status: "active",
      },
    ]);
    setGenericName("");
    setBrandName("");
    setType("generic");
    setCategory("");
    setManufacturer("");
    setDosageForm("");
    setDosageStrength("");
    setVolume("");
    setFieldErrors({ variants: {} });
    setFormError(null);
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between">
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

      <div className="flex flex-col gap-0">
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
              <Label htmlFor="pf-volume">Volume / Size</Label>
              <CreatableCombobox
                id="pf-volume"
                value={volume}
                onChange={setVolume}
                suggestions={suggestions.volumes}
                placeholder="e.g. 60ML, LARGE"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* ── Section 3+4: Mode-conditional ─────────────────────── */}
        {isEdit ? (
          <>
            {/* Edit: Packaging */}
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
                  <div className="h-9 rounded-md border bg-muted px-3 flex items-center text-sm font-mono">
                    {product?.sku}
                  </div>
                </div>
              </div>

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

            {/* Edit: Pricing & compliance */}
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
                    onChange={evt =>
                      setUnitCost(parseFloat(evt.target.value) || 0)
                    }
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
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Create: Packaging & pricing variants */
          <section className="py-6">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Packaging &amp; pricing
              </p>
              <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                {variants.length}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {variants.map((variant, index) => {
                const variantErrors = fieldErrors.variants[variant.id];
                const variantComposedName = genericName.trim()
                  ? composeProductName({
                      generic_name: genericName,
                      brand_name: brandName || null,
                      dosage_strength: dosageStrength || null,
                      dosage_form: dosageForm || null,
                      packaging_type: variant.packagingType,
                      unit_count: variant.unitCount,
                      volume: volume || null,
                    })
                  : "";

                return (
                  <div
                    key={variant.id}
                    className="border rounded-lg p-4 flex flex-col gap-3"
                  >
                    {/* Variant header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Variant {index + 1}
                      </span>
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeVariant(variant.id)}
                        >
                          <XIcon className="size-4" />
                        </Button>
                      )}
                    </div>

                    {/* Row 1: Packaging type | Units per pack | Barcode | SKU */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>
                          Packaging type{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <CreatableCombobox
                          value={variant.packagingType}
                          onChange={v => {
                            updateVariant(variant.id, "packagingType", v);
                            if (variantErrors?.packagingType)
                              clearVariantError(variant.id, "packagingType");
                          }}
                          suggestions={suggestions.packagingTypes}
                          placeholder="e.g. BOX"
                        />
                        {variantErrors?.packagingType && (
                          <p className="text-xs text-destructive mt-1">
                            {variantErrors.packagingType}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>
                          Units per pack{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <QuantityInput
                          value={variant.unitCount}
                          onChange={(v: number) => {
                            updateVariant(variant.id, "unitCount", v);
                            if (variantErrors?.unitCount)
                              clearVariantError(variant.id, "unitCount");
                          }}
                          min={1}
                        />
                        {variantErrors?.unitCount && (
                          <p className="text-xs text-destructive mt-1">
                            {variantErrors.unitCount}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Barcode</Label>
                        <Input
                          value={variant.barcode}
                          onChange={evt =>
                            updateVariant(
                              variant.id,
                              "barcode",
                              evt.target.value,
                            )
                          }
                          placeholder="EAN-13 (optional)"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>SKU</Label>
                        <div className="h-9 rounded-md border bg-muted px-3 flex items-center text-sm text-muted-foreground">
                          Auto-generated
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Unit cost | Prescription | Status */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>Unit cost (₱)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={variant.unitCost}
                          onChange={evt =>
                            updateVariant(
                              variant.id,
                              "unitCost",
                              parseFloat(evt.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Prescription requirement</Label>
                        <div
                          className="flex items-center gap-2 h-9 rounded-md border px-3 cursor-pointer"
                          onClick={() =>
                            updateVariant(
                              variant.id,
                              "requiresPrescription",
                              !variant.requiresPrescription,
                            )
                          }
                        >
                          <Checkbox
                            checked={variant.requiresPrescription}
                            onCheckedChange={checked =>
                              updateVariant(
                                variant.id,
                                "requiresPrescription",
                                Boolean(checked),
                              )
                            }
                          />
                          <span className="text-sm">
                            Requires prescription (Rx)
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>Status</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              variant.status === "active" ? "default" : "outline"
                            }
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              updateVariant(variant.id, "status", "active")
                            }
                          >
                            Active
                          </Button>
                          <Button
                            type="button"
                            variant={
                              variant.status === "inactive"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              updateVariant(variant.id, "status", "inactive")
                            }
                          >
                            Inactive
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Product name preview */}
                    <div className="flex items-baseline gap-3 rounded-md bg-muted/50 px-4 py-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        Product name preview →
                      </span>
                      <span className="text-sm font-medium">
                        {variantComposedName || (
                          <span className="text-muted-foreground italic">
                            Fill in generic name and packaging to preview
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Add variant button */}
              <button
                type="button"
                onClick={addVariant}
                className="w-full border border-dashed rounded-lg py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              >
                <PlusIcon className="size-4" />
                Add another packaging
              </button>
            </div>
          </section>
        )}

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
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : `Create ${variants.length} product${variants.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
