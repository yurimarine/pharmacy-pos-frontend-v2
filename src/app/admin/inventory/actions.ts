"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Inventory } from "@/types/inventory";
import { getCurrentUser, isAdmin } from "@/lib/get-current-user";

async function requireAdmin() {
  const currentUser = await getCurrentUser();
  if (!isAdmin(currentUser)) {
    throw new Error("Unauthorized: Admin access required");
  }
  return currentUser;
}

type InventoryInput = {
  product_id: string;
  pharmacy_id: string;
  quantity: number;
  low_stock_threshold: number;
  markup_percentage: number;
  selling_price: number;
  expiry_date?: string;
};

type InventoryUpdateInput = {
  quantity: number;
  low_stock_threshold: number;
  markup_percentage: number;
  selling_price: number;
  expiry_date?: string;
};

export async function getInventory(
  pharmacyId?: string,
  page: number = 1,
  pageSize: number = 20,
  search?: string,
): Promise<{ data: Inventory[]; count: number }> {
  const supabase = await createClient();

  // Step 1: pre-resolve matching product IDs when search is provided
  let matchingProductIds: string[] | null = null;
  if (search && search.trim()) {
    const term = search.trim();
    const { data: matchingProducts } = await supabase
      .from("products")
      .select("id")
      .or(`name.ilike.%${term}%,generic_name.ilike.%${term}%`);
    if (!matchingProducts || matchingProducts.length === 0) {
      return { data: [], count: 0 };
    }
    matchingProductIds = matchingProducts.map(p => p.id);
  }

  // Step 2: build inventory query
  let query = supabase
    .from("inventory")
    .select(
      "*, products(name, generic_name, base_price, requires_prescription, product_categories(name)), pharmacies(name)",
      { count: "exact" },
    )
    .eq("is_active", true);

  // Step 3: pharmacy filter
  if (pharmacyId) {
    query = query.eq("pharmacy_id", pharmacyId);
  }

  // Step 4: search filter via pre-resolved product IDs
  if (matchingProductIds) {
    query = query.in("product_id", matchingProductIds);
  }

  // Step 5: pagination last, after all filters
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const sorted = (data ?? []).sort((a, b) => {
    const nameA = a.products?.name?.toLowerCase() ?? "";
    const nameB = b.products?.name?.toLowerCase() ?? "";
    return nameA.localeCompare(nameB);
  });

  return { data: sorted, count: count ?? 0 };
}

export async function getInventoryById(id: string): Promise<Inventory> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select(
      "*, products(name, generic_name, base_price, requires_prescription, product_categories(name)), pharmacies(name)",
    )
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createInventoryEntry(
  data: InventoryInput,
): Promise<Inventory> {
  const currentUser = await getCurrentUser();

  if (currentUser.role !== "admin" && currentUser.role !== "pharmacist") {
    throw new Error("Unauthorized");
  }

  if (
    currentUser.role === "pharmacist" &&
    currentUser.pharmacy_id &&
    data.pharmacy_id !== currentUser.pharmacy_id
  ) {
    throw new Error(
      "Unauthorized: You can only add stock to your assigned pharmacy.",
    );
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("inventory")
    .select("id")
    .eq("product_id", data.product_id)
    .eq("pharmacy_id", data.pharmacy_id)
    .single();

  if (existing) {
    throw new Error(
      "This product already has an inventory entry for this pharmacy.",
    );
  }

  const { data: entry, error } = await supabase
    .from("inventory")
    .insert(data)
    .select(
      "*, products(name, generic_name, base_price, requires_prescription, product_categories(name)), pharmacies(name)",
    )
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/inventory");
  return entry;
}

export async function updateInventoryEntry(
  id: string,
  data: InventoryUpdateInput,
  reason: string,
): Promise<Inventory> {
  const currentUser = await getCurrentUser();

  if (currentUser.role !== "admin" && currentUser.role !== "pharmacist") {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  if (currentUser.role === "pharmacist" && currentUser.pharmacy_id) {
    const { data: existingEntry } = await supabase
      .from("inventory")
      .select("pharmacy_id")
      .eq("id", id)
      .single();

    if (
      existingEntry &&
      existingEntry.pharmacy_id !== currentUser.pharmacy_id
    ) {
      throw new Error(
        "Unauthorized: You can only edit inventory for your assigned pharmacy.",
      );
    }
  }

  const { data: currentRow, error: fetchError } = await supabase
    .from("inventory")
    .select("quantity, product_id, pharmacy_id")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { data: entry, error } = await supabase
    .from("inventory")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(
      "*, products(name, generic_name, base_price, requires_prescription, product_categories(name)), pharmacies(name)",
    )
    .single();
  if (error) throw new Error(error.message);

  const { error: logError } = await supabase.from("inventory_logs").insert({
    inventory_id: id,
    product_id: currentRow.product_id,
    pharmacy_id: currentRow.pharmacy_id,
    changed_by: currentUser.id,
    change_type: "manual_adjustment",
    previous_quantity: currentRow.quantity,
    new_quantity: data.quantity,
    reason,
  });
  if (logError) throw new Error(logError.message);

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory-logs");
  return entry;
}

export async function deactivateInventoryEntry(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("inventory")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/inventory");
}

export async function getPharmaciesForSelect(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pharmacies")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getActiveProductsForInventorySelect(): Promise<
  {
    id: string;
    name: string;
    generic_name: string | null;
    base_price: number;
  }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, generic_name, base_price")
    .eq("status", "active")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
