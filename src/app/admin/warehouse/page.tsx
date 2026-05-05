import { getCurrentUser } from "@/lib/get-current-user"
import { getWarehouseInventory, getWarehouseInventoryStats } from "./actions"
import { WarehouseInventoryTable } from "@/components/warehouse/WarehouseInventoryTable"

export default async function WarehousePage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    has_stock?: string
    expiring_within?: string
    page?: string
  }>
}) {
  const params = await searchParams

  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20
  const search = params.search

  const has_stock =
    params.has_stock === "true"
      ? true
      : params.has_stock === "false"
        ? false
        : undefined

  const expiring_within_days =
    params.expiring_within !== undefined
      ? parseInt(params.expiring_within, 10) || undefined
      : undefined

  const [{ data, count }, stats, currentUser] = await Promise.all([
    getWarehouseInventory({ search, has_stock, expiring_within_days, page, pageSize }),
    getWarehouseInventoryStats(),
    getCurrentUser(),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Warehouse Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Central stock — all received batches
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Batches</p>
          <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">In Stock</p>
          <p className="text-2xl font-bold tabular-nums text-green-600">
            {stats.inStock}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Expiring Soon</p>
          <p className="text-2xl font-bold tabular-nums text-yellow-600">
            {stats.expiringSoon}
          </p>
        </div>
      </div>

      <WarehouseInventoryTable
        data={data}
        count={count}
        page={page}
        pageSize={pageSize}
        search={search}
        has_stock={has_stock}
        expiring_within_days={expiring_within_days}
        userRole={currentUser.role}
      />
    </div>
  )
}
