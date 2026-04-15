"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Batch,
  BatchItem,
  BatchWithItems,
  BatchType,
  StockOutReason,
} from "@/types/batch";

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("users")
    .select("id, name, role, pharmacy_id")
    .eq("auth_id", user.id)
    .single();

  if (!data) throw new Error("User record not found");
  return data;
}

export async function getCurrentUserRole(): Promise<{
  role: string;
  isAdmin: boolean;
}> {
  const user = await getCurrentUser();
  return { role: user.role, isAdmin: user.role === "admin" };
}

// ─────────────────────────────────────────────
// LIST ACTIONS
// ─────────────────────────────────────────────

export async function getBatches(showCancelled?: boolean): Promise<Batch[]> {
  const supabase = await createClient();

  await supabase.rpc("cancel_stale_draft_batches");

  const currentUser = await getCurrentUser();

  let query = supabase
    .from("batches")
    .select(
      `
    *,
    pharmacy:pharmacies!batches_pharmacy_id_fkey ( name ),
    transfer_pharmacy:pharmacies!batches_transfer_to_pharmacy_id_fkey ( name ),
    users ( name, role )
  `,
    )
    .order("created_at", { ascending: false });

  if (currentUser.role !== "admin") {
    query = query.eq("pharmacy_id", currentUser.pharmacy_id);
  }

  if (!showCancelled) {
    query = query.neq("status", "cancelled");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Batch[];
}

export async function createBatch(data: {
  type: BatchType;
  pharmacy_id: string | null;
  notes?: string;
}): Promise<Batch> {
  const supabase = await createClient();

  // markup_change must be scoped to a pharmacy
  if (data.type === "markup_change" && !data.pharmacy_id) {
    throw new Error("Markup change batches require a pharmacy.");
  }

  // base_price_change is always global — ignore any provided pharmacy
  const pharmacyId =
    data.type === "base_price_change" ? null : data.pharmacy_id;

  const currentUser = await getCurrentUser();

  const { data: batchNumber, error: rpcError } = await supabase.rpc(
    "generate_batch_number",
    { p_type: data.type },
  );
  if (rpcError) throw new Error(rpcError.message);

  const { data: batch, error } = await supabase
    .from("batches")
    .insert({
      batch_number: batchNumber,
      type: data.type,
      pharmacy_id: pharmacyId,
      created_by: currentUser.id,
      status: "draft",
      notes: data.notes || null,
    })
    .select(`*,
      pharmacy:pharmacies!batches_pharmacy_id_fkey ( name ),
      transfer_pharmacy:pharmacies!batches_transfer_to_pharmacy_id_fkey ( name ),
      users ( name, role )`)
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/batches");
  return batch as Batch;
}

export async function cancelBatch(id: string): Promise<void> {
  const supabase = await createClient();

  const currentUser = await getCurrentUser();
  if (currentUser.role !== "admin") {
    throw new Error("Only admins can cancel batches.");
  }

  const { error } = await supabase
    .from("batches")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/batches");
}

export async function getPharmaciesForBatchSelect(): Promise<
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

// ─────────────────────────────────────────────
// DETAIL ACTIONS
// ─────────────────────────────────────────────

export async function getBatchById(id: string): Promise<BatchWithItems> {
  const supabase = await createClient();

  const { data: batch, error } = await supabase
    .from("batches")
    .select(
      `*,
       pharmacy:pharmacies!batches_pharmacy_id_fkey ( name ),
       transfer_pharmacy:pharmacies!batches_transfer_to_pharmacy_id_fkey ( name ),
       users ( name, role ),
       batch_items(
         *,
         products(name, generic_name, base_price, requires_prescription),
         suppliers(name),
         manufacturers(name)
       )`,
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  if (!batch) throw new Error("Batch not found");

  // Attach inventory quantities for display (stock levels at time of page load)
  const productIds = (batch.batch_items ?? []).map(
    (item: BatchItem) => item.product_id,
  );

  if (productIds.length > 0) {
    const { data: invRows } = await supabase
      .from("inventory")
      .select("product_id, quantity")
      .eq("pharmacy_id", batch.pharmacy_id)
      .in("product_id", productIds);

    const invMap = new Map(
      (invRows ?? []).map((r: { product_id: string; quantity: number }) => [
        r.product_id,
        r.quantity,
      ]),
    );

    batch.batch_items = (batch.batch_items ?? []).map((item: BatchItem) => ({
      ...item,
      inventory_quantity: invMap.get(item.product_id),
    }));
  }

  return batch as BatchWithItems;
}

export async function addBatchItem(data: {
  batch_id: string;
  product_id: string;
  supplier_id?: string;
  manufacturer_id?: string;
  quantity: number;
  unit_cost?: number;
  expiry_date?: string;
  reason?: StockOutReason;
  notes?: string;
}): Promise<BatchItem> {
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("batches")
    .select("status")
    .eq("id", data.batch_id)
    .single();

  if (!batch || batch.status !== "draft") {
    throw new Error("Can only add items to draft batches.");
  }

  const { data: item, error } = await supabase
    .from("batch_items")
    .insert({
      batch_id: data.batch_id,
      product_id: data.product_id,
      supplier_id: data.supplier_id || null,
      manufacturer_id: data.manufacturer_id || null,
      quantity: data.quantity,
      unit_cost: data.unit_cost ?? null,
      expiry_date: data.expiry_date || null,
      reason: data.reason || null,
      notes: data.notes || null,
    })
    .select(
      "*, products(name, generic_name, base_price, requires_prescription), suppliers(name), manufacturers(name)",
    )
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/batches/${data.batch_id}`);
  return item as BatchItem;
}

export async function removeBatchItem(
  itemId: string,
  batchId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("batches")
    .select("status")
    .eq("id", batchId)
    .single();

  if (!batch || batch.status !== "draft") {
    throw new Error("Can only remove items from draft batches.");
  }

  const { error } = await supabase
    .from("batch_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/batches/${batchId}`);
}

export async function finalizeBatch(id: string): Promise<{
  success: boolean;
  priceChanges: Array<{
    productName: string;
    oldPrice: number;
    newPrice: number;
  }>;
}> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Step 1: Fetch batch with all items
  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select(
      `id, type, status, pharmacy_id,
       batch_items(
         id, product_id, quantity, unit_cost, reason, expiry_date,
         products(id, name, base_price)
       )`,
    )
    .eq("id", id)
    .single();

  if (batchError || !batch) throw new Error("Batch not found");

  // Step 2: Verify draft
  if (batch.status !== "draft") {
    throw new Error("Batch is not in draft status.");
  }

  // Step 3: Verify has items
  const items = (batch.batch_items ?? []) as unknown as Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_cost: number | null;
    reason: string | null;
    expiry_date: string | null;
    products: { id: string; name: string; base_price: number } | null;
  }>;
  if (items.length === 0) {
    throw new Error("Add at least one item before finalizing.");
  }

  // Step 4a: markup_change — update inventory.markup_percentage for this pharmacy only.
  // item.unit_cost stores the new markup percentage (not a cost value).
  if (batch.type === "markup_change") {
    const errors: string[] = [];

    for (const item of items) {
      if (item.unit_cost == null || !item.products) continue;

      const { data: invRow } = await supabase
        .from("inventory")
        .select("id")
        .eq("product_id", item.product_id)
        .eq("pharmacy_id", batch.pharmacy_id)
        .single();

      if (!invRow) {
        errors.push(
          `${item.products.name} has no inventory record in this pharmacy.`,
        );
        continue;
      }

      const { data: product } = await supabase
        .from("products")
        .select("base_price")
        .eq("id", item.product_id)
        .single();

      const basePrice = Number(product?.base_price ?? 0);
      // item.unit_cost stores the new markup percentage for markup_change batches
      const newMarkup = Number(item.unit_cost);
      const newSelling = Math.round(
        (basePrice + basePrice * (newMarkup / 100)) * 100,
      ) / 100;

      const { error } = await supabase
        .from("inventory")
        .update({
          markup_percentage: newMarkup,
          selling_price: newSelling,
          updated_at: now,
        })
        .eq("id", invRow.id);
      if (error) throw new Error(error.message);
    }

    if (errors.length > 0) throw new Error(errors.join("; "));

    const { error: completeError } = await supabase
      .from("batches")
      .update({ status: "completed", updated_at: now })
      .eq("id", id);
    if (completeError) throw new Error(completeError.message);

    revalidatePath("/admin/batches");
    revalidatePath(`/admin/batches/${id}`);

    return { success: true, priceChanges: [] };
  }

  // Step 4b: base_price_change — update products.base_price globally and recalculate
  // selling_price for all pharmacies that stock each product.
  // item.unit_cost stores the new base price.
  if (batch.type === "base_price_change") {
    const priceChanges: Array<{
      productName: string;
      oldPrice: number;
      newPrice: number;
    }> = [];

    for (const item of items) {
      if (item.unit_cost == null || !item.products) continue;

      const newBasePrice = Number(item.unit_cost);
      const oldBasePrice = Number(item.products.base_price);

      const { error: productError } = await supabase
        .from("products")
        .update({ base_price: newBasePrice, updated_at: now })
        .eq("id", item.product_id);
      if (productError) throw new Error(productError.message);

      const { data: allInvRows } = await supabase
        .from("inventory")
        .select("id, markup_percentage")
        .eq("product_id", item.product_id)
        .eq("is_active", true);

      for (const invRow of allInvRows ?? []) {
        const newSelling = Math.round(
          (newBasePrice + newBasePrice * (Number(invRow.markup_percentage) / 100)) * 100,
        ) / 100;
        await supabase
          .from("inventory")
          .update({ selling_price: newSelling, updated_at: now })
          .eq("id", invRow.id);
      }

      priceChanges.push({
        productName: item.products.name,
        oldPrice: oldBasePrice,
        newPrice: newBasePrice,
      });
    }

    const { error: completeError } = await supabase
      .from("batches")
      .update({ status: "completed", updated_at: now })
      .eq("id", id);
    if (completeError) throw new Error(completeError.message);

    revalidatePath("/admin/batches");
    revalidatePath(`/admin/batches/${id}`);

    return { success: true, priceChanges };
  }

  // Step 4b: Stock out inventory validation
  const stockOutInvMap = new Map<string, { id: string; quantity: number }>();
  if (batch.type === "stock_out") {
    const insufficientItems: string[] = [];

    for (const item of items) {
      const { data: inv } = await supabase
        .from("inventory")
        .select("id, quantity")
        .eq("product_id", item.product_id)
        .eq("pharmacy_id", batch.pharmacy_id)
        .single();

      if (!inv) {
        throw new Error(
          `${item.products?.name} has no inventory record in this pharmacy.`,
        );
      }

      stockOutInvMap.set(item.product_id, inv);

      if (item.quantity > inv.quantity) {
        insufficientItems.push(
          `${item.products?.name} (needs ${item.quantity}, has ${inv.quantity})`,
        );
      }
    }

    if (insufficientItems.length > 0) {
      throw new Error(
        `Insufficient stock for: ${insufficientItems.join("; ")}`,
      );
    }
  }

  // Step 5: Detect price changes (stock_in only)
  const priceChangeMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      oldPrice: number;
      newPrice: number;
    }
  >();

  if (batch.type === "stock_in") {
    for (const item of items) {
      if (
        item.unit_cost !== null &&
        item.unit_cost !== undefined &&
        item.products
      ) {
        const unitCost = Number(item.unit_cost);
        const basePrice = Number(item.products.base_price);
        if (
          Math.abs(unitCost - basePrice) > 0.001 &&
          !priceChangeMap.has(item.product_id)
        ) {
          priceChangeMap.set(item.product_id, {
            productId: item.product_id,
            productName: item.products.name,
            oldPrice: basePrice,
            newPrice: unitCost,
          });
        }
      }
    }
  }

  // Step 6: Apply inventory changes
  for (const item of items) {
    if (batch.type === "stock_in") {
      const { data: existingInv } = await supabase
        .from("inventory")
        .select("id, quantity")
        .eq("product_id", item.product_id)
        .eq("pharmacy_id", batch.pharmacy_id)
        .single();

      if (existingInv) {
        const updatePayload: Record<string, unknown> = {
          quantity: existingInv.quantity + item.quantity,
          last_restocked_at: now,
          updated_at: now,
        };
        if (item.expiry_date) {
          updatePayload.expiry_date = item.expiry_date;
        }
        const { error } = await supabase
          .from("inventory")
          .update(updatePayload)
          .eq("id", existingInv.id);
        if (error) throw new Error(error.message);
      } else {
        const basePrice = item.unit_cost ?? item.products?.base_price ?? 0;
        const { error } = await supabase.from("inventory").insert({
          product_id: item.product_id,
          pharmacy_id: batch.pharmacy_id,
          quantity: item.quantity,
          low_stock_threshold: 10,
          markup_percentage: 0,
          selling_price: Number(basePrice),
          is_active: true,
          expiry_date: item.expiry_date ?? null,
          last_restocked_at: now,
        });
        if (error) throw new Error(error.message);
      }
    } else {
      const inv = stockOutInvMap.get(item.product_id)!;
      const { error } = await supabase
        .from("inventory")
        .update({ quantity: inv.quantity - item.quantity, updated_at: now })
        .eq("id", inv.id);
      if (error) throw new Error(error.message);
    }
  }

  // Step 7: Apply base_price + selling_price updates (stock_in price changes)
  const priceChanges = Array.from(priceChangeMap.values());
  for (const change of priceChanges) {
    const { error: productError } = await supabase
      .from("products")
      .update({ base_price: change.newPrice, updated_at: now })
      .eq("id", change.productId);
    if (productError) throw new Error(productError.message);

    const { data: allInvRows } = await supabase
      .from("inventory")
      .select("id, markup_percentage")
      .eq("product_id", change.productId);

    for (const invRow of allInvRows ?? []) {
      const newSelling =
        change.newPrice +
        change.newPrice * (Number(invRow.markup_percentage) / 100);
      await supabase
        .from("inventory")
        .update({
          selling_price: Math.round(newSelling * 100) / 100,
          updated_at: now,
        })
        .eq("id", invRow.id);
    }
  }

  // Step 8: Mark batch completed
  const { error: completeError } = await supabase
    .from("batches")
    .update({ status: "completed", updated_at: now })
    .eq("id", id);
  if (completeError) throw new Error(completeError.message);

  // Step 9: Revalidate
  revalidatePath("/admin/batches");
  revalidatePath(`/admin/batches/${id}`);

  return {
    success: true,
    priceChanges: priceChanges.map(c => ({
      productName: c.productName,
      oldPrice: c.oldPrice,
      newPrice: c.newPrice,
    })),
  };
}

export type PriceChangePreviewItem =
  | {
      type: "markup_change";
      productName: string;
      oldMarkup: number;
      newMarkup: number;
      oldSellingPrice: number;
      newSellingPrice: number;
      pharmacyName: string | null;
    }
  | {
      type: "base_price_change";
      productName: string;
      oldBasePrice: number;
      newBasePrice: number;
      affectedPharmaciesCount: number;
      pharmacyBreakdown: {
        pharmacyName: string | null | undefined;
        oldSelling: number;
        newSelling: number;
      }[];
    };

export async function getPriceChangePreview(
  batchId: string,
): Promise<PriceChangePreviewItem[]> {
  const supabase = await createClient();

  // Fetch batch type and pharmacy
  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select(
      "type, pharmacy_id, pharmacy:pharmacies!batches_pharmacy_id_fkey(name)",
    )
    .eq("id", batchId)
    .single();
  if (batchError || !batch) throw new Error("Batch not found");

  const { data: items, error: itemsError } = await supabase
    .from("batch_items")
    .select("product_id, unit_cost, products(id, name, base_price)")
    .eq("batch_id", batchId)
    .not("unit_cost", "is", null);
  if (itemsError) throw new Error(itemsError.message);

  type PreviewItem = {
    product_id: string;
    unit_cost: number | null;
    products: { id: string; name: string; base_price: number } | null;
  };
  const typedItems = (items ?? []) as unknown as PreviewItem[];
  const results: PriceChangePreviewItem[] = [];

  if (batch.type === "markup_change") {
    for (const item of typedItems) {
      if (item.unit_cost == null || !item.products) continue;

      const { data: invRow } = await supabase
        .from("inventory")
        .select("markup_percentage, selling_price")
        .eq("product_id", item.product_id)
        .eq("pharmacy_id", batch.pharmacy_id)
        .single();

      const basePrice = Number(item.products.base_price);
      const newMarkup = Number(item.unit_cost);
      const newSelling = Math.round(
        (basePrice + basePrice * (newMarkup / 100)) * 100,
      ) / 100;

      const pharmacyData = (
        Array.isArray(batch.pharmacy) ? batch.pharmacy[0] : batch.pharmacy
      ) as { name: string } | null | undefined;
      results.push({
        type: "markup_change",
        productName: item.products.name,
        oldMarkup: Number(invRow?.markup_percentage ?? 0),
        newMarkup,
        oldSellingPrice: Number(invRow?.selling_price ?? 0),
        newSellingPrice: newSelling,
        pharmacyName: pharmacyData?.name ?? null,
      });
    }
  } else if (batch.type === "base_price_change") {
    for (const item of typedItems) {
      if (item.unit_cost == null || !item.products) continue;

      const { data: allInvRows } = await supabase
        .from("inventory")
        .select(
          "selling_price, markup_percentage, pharmacies(name)",
        )
        .eq("product_id", item.product_id)
        .eq("is_active", true);

      const newBasePrice = Number(item.unit_cost);
      type InvPreviewRow = {
        selling_price: number;
        markup_percentage: number;
        pharmacies: { name: string } | null;
      };
      const invRows = (allInvRows ?? []) as unknown as InvPreviewRow[];

      results.push({
        type: "base_price_change",
        productName: item.products.name,
        oldBasePrice: Number(item.products.base_price),
        newBasePrice,
        affectedPharmaciesCount: invRows.length,
        pharmacyBreakdown: invRows.map(inv => ({
          pharmacyName: inv.pharmacies?.name,
          oldSelling: Number(inv.selling_price),
          newSelling: Math.round(
            (newBasePrice + newBasePrice * (Number(inv.markup_percentage) / 100)) * 100,
          ) / 100,
        })),
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────
// SELECT HELPERS FOR ADD ITEM MODAL
// ─────────────────────────────────────────────

export async function getProductsForBatchSelect(
  pharmacyId: string | null,
  batchType: BatchType,
): Promise<
  {
    id: string;
    name: string;
    generic_name: string | null;
    base_price: number;
    current_quantity?: number;
    current_markup?: number;
    current_selling_price?: number;
    affected_pharmacies?: {
      pharmacy_id: string;
      pharmacy_name: string | null | undefined;
      current_markup: number;
      current_selling_price: number;
    }[];
  }[]
> {
  const supabase = await createClient();

  // stock_in: all active products
  if (batchType === "stock_in") {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, generic_name, base_price")
      .eq("status", "active")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  // stock_out + markup_change: only products with inventory at this pharmacy
  if (batchType === "stock_out" || batchType === "markup_change") {
    const { data, error } = await supabase
      .from("inventory")
      .select(
        "markup_percentage, selling_price, quantity, products!inner(id, name, generic_name, base_price)",
      )
      .eq("pharmacy_id", pharmacyId!)
      .eq("is_active", true)
      .order("products(name)", { ascending: true });

    if (error) throw new Error(error.message);

    type InvRow = {
      markup_percentage: number;
      selling_price: number;
      quantity: number;
      products: {
        id: string;
        name: string;
        generic_name: string | null;
        base_price: number;
      };
    };
    return ((data ?? []) as unknown as InvRow[])
      .filter(inv => inv.products !== null)
      .map(inv => ({
        id: inv.products.id,
        name: inv.products.name,
        generic_name: inv.products.generic_name,
        base_price: Number(inv.products.base_price),
        current_quantity: inv.quantity,
        current_markup: Number(inv.markup_percentage),
        current_selling_price: Number(inv.selling_price),
      }));
  }

  // base_price_change: all active products, with per-pharmacy inventory breakdown
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, generic_name, base_price,
       inventory ( pharmacy_id, markup_percentage, selling_price, pharmacies ( name ) )`,
    )
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  type ProductRow = {
    id: string;
    name: string;
    generic_name: string | null;
    base_price: number;
    inventory: {
      pharmacy_id: string;
      markup_percentage: number;
      selling_price: number;
      pharmacies: { name: string } | null;
    }[];
  };
  return ((data ?? []) as unknown as ProductRow[]).map(product => ({
    id: product.id,
    name: product.name,
    generic_name: product.generic_name,
    base_price: Number(product.base_price),
    affected_pharmacies: (product.inventory ?? []).map(inv => ({
      pharmacy_id: inv.pharmacy_id,
      pharmacy_name: inv.pharmacies?.name,
      current_markup: Number(inv.markup_percentage),
      current_selling_price: Number(inv.selling_price),
    })),
  }));
}

export async function getSuppliersForBatchSelect(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getManufacturersForBatchSelect(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("manufacturers")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
