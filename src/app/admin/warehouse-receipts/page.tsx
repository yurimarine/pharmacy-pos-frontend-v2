import { getCurrentUser } from "@/lib/get-current-user";
import { getWarehouseReceipts } from "./actions";
import { getSuppliers } from "@/app/admin/suppliers/actions";
import { WarehouseReceiptsTable } from "@/components/warehouse-receipts/WarehouseReceiptsTable";
import type { WarehouseReceiptStatus } from "@/types/warehouse-receipt";

const VALID_STATUSES: WarehouseReceiptStatus[] = [
  "draft",
  "completed",
  "cancelled",
];

export default async function WarehouseReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    supplier_id?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;
  const search = params.search;
  const status = VALID_STATUSES.includes(
    params.status as WarehouseReceiptStatus,
  )
    ? (params.status as WarehouseReceiptStatus)
    : undefined;
  const supplier_id = params.supplier_id || undefined;

  const [{ data, count }, suppliers, currentUser] = await Promise.all([
    getWarehouseReceipts({ search, status, supplier_id, page, pageSize }),
    getSuppliers(),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Warehouse Receipts
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage incoming stock receipts
        </p>
      </div>

      <WarehouseReceiptsTable
        data={data}
        count={count}
        page={page}
        pageSize={pageSize}
        search={search}
        status={status ?? ""}
        supplier_id={supplier_id ?? ""}
        suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))}
        userRole={currentUser.role}
      />
    </div>
  );
}
