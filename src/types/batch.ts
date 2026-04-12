export type BatchType = "stock_in" | "stock_out";
export type BatchStatus = "draft" | "completed" | "cancelled";
export type StockOutReason =
  | "damaged"
  | "expired"
  | "returned"
  | "adjustment"
  | "transferred";

export type Batch = {
  id: string;
  batch_number: string;
  type: BatchType;
  pharmacy_id: string;
  transfer_to_pharmacy_id: string | null;
  created_by: string;
  status: BatchStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  pharmacy: { name: string } | null; // ← renamed from pharmacies
  transfer_pharmacy: { name: string } | null; // ← new
  users?: { name: string; role: string } | null;
  batch_items?: { count: number }[];
};

export type BatchItem = {
  id: string;
  batch_id: string;
  product_id: string;
  supplier_id: string | null;
  manufacturer_id: string | null;
  quantity: number;
  unit_cost: number | null;
  expiry_date: string | null;
  reason: StockOutReason | null;
  notes: string | null;
  created_at: string;
  inventory_quantity?: number;
  products?: {
    name: string;
    generic_name: string | null;
    base_price: number;
    requires_prescription: boolean;
  } | null;
  suppliers?: { name: string } | null;
  manufacturers?: { name: string } | null;
};

export type BatchWithItems = Omit<Batch, "batch_items"> & {
  batch_items: BatchItem[];
};
