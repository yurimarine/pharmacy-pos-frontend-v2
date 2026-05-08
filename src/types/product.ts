export type ProductType = "generic" | "branded" | "otc";
export type ProductStatus = "active" | "inactive" | "discontinued";

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  generic: "Generic",
  branded: "Branded",
  otc: "OTC",
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  discontinued: "Discontinued",
};

export type SuggestionItem = {
  id: string;
  name: string;
};

export type ProductSuggestions = {
  genericNames: SuggestionItem[];
  brandNames: SuggestionItem[];
  dosageForms: SuggestionItem[];
  dosageStrengths: SuggestionItem[];
  volumes: SuggestionItem[];
  packagingTypes: SuggestionItem[];
  categories: SuggestionItem[];
  manufacturers: SuggestionItem[];
};

export type Product = {
  id: string;
  product_name: string;
  generic_name: string;
  brand_name: string | null;
  dosage_form: string | null;
  dosage_strength: string | null;
  volume: string | null;
  packaging_type: string;
  unit_count: number;
  manufacturer: string | null;
  category: string | null;
  type: ProductType;
  requires_prescription: boolean;
  unit_cost: number;
  status: ProductStatus;
  sku: string;
  barcode: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductFormData = {
  generic_name: string;
  brand_name: string | null;
  dosage_form: string | null;
  dosage_strength: string | null;
  volume: string | null;
  packaging_type: string;
  unit_count: number;
  manufacturer: string | null;
  category: string | null;
  type: ProductType;
  requires_prescription: boolean;
  unit_cost: number;
  status: ProductStatus;
  barcode: string | null;
};

export type POSProductOption = {
  id: string;
  product_name: string;
  generic_name: string;
  packaging_type: string;
  unit_count: number;
  requires_prescription: boolean;
  unit_cost: number;
};

export function composeProductName(data: {
  generic_name: string;
  brand_name?: string | null;
  dosage_strength?: string | null;
  dosage_form?: string | null;
  packaging_type: string;
  unit_count?: number;
  volume?: string | null;
}): string {
  const parts = [
    data.generic_name,
    data.brand_name,
    data.dosage_strength,
    data.dosage_form,
  ]
    .filter(Boolean)
    .map(p => p!.trim().toUpperCase());

  const base = parts.join(" ");
  const packagingUpper = data.packaging_type.trim().toUpperCase();
  const unitCount = data.unit_count ?? 1;
  const volume = data.volume?.trim();

  let suffix = "";
  if (volume) {
    suffix = ` ${volume.toUpperCase()}`;
  } else if (unitCount > 1) {
    suffix = ` ${packagingUpper} ${unitCount}'S`;
  }

  return base + suffix;
}

export function computeSellingPrice(
  unitCost: number,
  markupPercentage: number,
): number {
  return Math.round(unitCost * (1 + markupPercentage / 100) * 100) / 100;
}

export function computeMarkupPercentage(
  unitCost: number,
  sellingPrice: number,
): number {
  if (unitCost === 0) return 0;
  return Math.round(((sellingPrice - unitCost) / unitCost) * 100 * 100) / 100;
}
