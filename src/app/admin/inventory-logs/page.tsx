import { getInventoryLogs, getPharmaciesForLogsSelect } from "./actions"
import { InventoryLogsTable } from "@/components/inventory-logs/InventoryLogsTable"

export default async function InventoryLogsPage() {
  let logs
  let pharmacies
  try {
    ;[logs, pharmacies] = await Promise.all([
      getInventoryLogs(),
      getPharmaciesForLogsSelect(),
    ])
  } catch (err) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Audit trail of all direct inventory edits
          </p>
        </div>
        <p className="text-destructive text-sm">
          Failed to load inventory logs.{" "}
          {err instanceof Error ? err.message : ""}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Audit trail of all direct inventory edits
        </p>
      </div>
      <InventoryLogsTable logs={logs} pharmacies={pharmacies} />
    </div>
  )
}
