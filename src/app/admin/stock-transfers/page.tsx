import { getStockTransfers, getStockTransferStats } from "./actions"
import { getPharmacies } from "@/app/admin/pharmacies/actions"
import { getCurrentUser } from "@/lib/get-current-user"
import StockTransfersTable from "@/components/stock-transfers/StockTransfersTable"
import type { StockTransferStatus } from "@/types/inventory"
import { ArrowRightLeftIcon, ClipboardListIcon, CheckCircleIcon } from "lucide-react"

export default async function StockTransfersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    pharmacy_id?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20

  const [{ data, count }, stats, pharmacies] = await Promise.all([
    getStockTransfers({
      search: params.search,
      status: params.status as StockTransferStatus | undefined,
      pharmacy_id: params.pharmacy_id,
      page,
      pageSize,
    }),
    getStockTransferStats(),
    getPharmacies(),
  ])

  await getCurrentUser()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock Transfers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Move stock from the warehouse to pharmacy locations.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <div className="p-2 bg-muted rounded-md">
            <ArrowRightLeftIcon className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Transfers</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
            <ClipboardListIcon className="size-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Draft</p>
            <p className="text-2xl font-semibold">{stats.draft}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
            <CheckCircleIcon className="size-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-semibold">{stats.completed}</p>
          </div>
        </div>
      </div>

      <StockTransfersTable
        transfers={data}
        count={count}
        page={page}
        pageSize={pageSize}
        pharmacies={pharmacies}
      />
    </div>
  )
}
