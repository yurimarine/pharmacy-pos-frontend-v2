import { getCurrentUser } from "@/lib/get-current-user"
import { getInventoryLogs } from "./actions"
import type { InventoryLogEntityType, InventoryLogAction } from "@/types/inventory"
import InventoryLogsTable from "@/components/inventory-logs/InventoryLogsTable"

export default async function InventoryLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    entity_type?: string
    action?: string
    date_from?: string
    date_to?: string
    page?: string
  }>
}) {
  const params = await searchParams
  await getCurrentUser()

  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 50

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString().split("T")[0]

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoISO = weekAgo.toISOString().split("T")[0]

  const [logsResult, todayResult, weekResult] = await Promise.all([
    getInventoryLogs({
      search: params.search,
      entity_type: params.entity_type as InventoryLogEntityType | undefined,
      action: params.action as InventoryLogAction | undefined,
      date_from: params.date_from,
      date_to: params.date_to,
      page,
      pageSize,
    }),
    getInventoryLogs({ date_from: todayISO, pageSize: 1 }),
    getInventoryLogs({ date_from: weekAgoISO, pageSize: 1 }),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full audit trail of all stock movements
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Logs</p>
          <p className="text-2xl font-bold">{logsResult.count.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">Today</p>
          <p className="text-2xl font-bold">{todayResult.count.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground mb-1">This Week</p>
          <p className="text-2xl font-bold">{weekResult.count.toLocaleString()}</p>
        </div>
      </div>

      <InventoryLogsTable
        data={logsResult.data}
        count={logsResult.count}
        page={page}
        pageSize={pageSize}
        search={params.search}
        entity_type={params.entity_type as InventoryLogEntityType | undefined}
        action={params.action as InventoryLogAction | undefined}
        date_from={params.date_from}
        date_to={params.date_to}
      />
    </div>
  )
}
