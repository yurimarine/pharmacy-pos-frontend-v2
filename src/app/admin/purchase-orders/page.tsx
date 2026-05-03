import { getCurrentUser } from "@/lib/get-current-user"
import { getPurchaseOrders } from "./actions"
import { getSuppliers } from "@/app/admin/suppliers/actions"
import { PurchaseOrdersTable } from "@/components/purchase-orders/PurchaseOrdersTable"
import type { PurchaseOrderStatus } from "@/types/purchase-order"

const VALID_STATUSES: PurchaseOrderStatus[] = [
  "draft",
  "submitted",
  "partially_received",
  "received",
  "cancelled",
]

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    supplier_id?: string
    page?: string
  }>
}) {
  const params = await searchParams

  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20
  const search = params.search
  const status = VALID_STATUSES.includes(params.status as PurchaseOrderStatus)
    ? (params.status as PurchaseOrderStatus)
    : undefined
  const supplier_id = params.supplier_id || undefined

  const [{ data, count }, suppliers, currentUser] = await Promise.all([
    getPurchaseOrders({ search, status, supplier_id, page, pageSize }),
    getSuppliers(),
    getCurrentUser(),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="text-sm text-muted-foreground">Manage supplier purchase orders</p>
      </div>

      <PurchaseOrdersTable
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
  )
}
