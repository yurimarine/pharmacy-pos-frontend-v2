import { getPackagingUnits } from "./actions"
import { PackagingUnitsTable } from "@/components/packaging-units/PackagingUnitsTable"
import type { PackagingUnit } from "@/types/reference-data"

export default async function PackagingUnitsPage() {
  let units: PackagingUnit[] = []
  let fetchError: string | null = null

  try {
    units = await getPackagingUnits()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load packaging units"
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Packaging Units</h1>
        <p className="text-sm text-muted-foreground">
          Manage units used for product packaging
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <PackagingUnitsTable units={units} />
      )}
    </div>
  )
}
