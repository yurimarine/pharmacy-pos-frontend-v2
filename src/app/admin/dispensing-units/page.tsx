import { getDispensingUnits } from "./actions"
import { DispensingUnitsTable } from "@/components/dispensing-units/DispensingUnitsTable"
import type { DispensingUnit } from "@/types/reference-data"

export default async function DispensingUnitsPage() {
  let units: DispensingUnit[] = []
  let fetchError: string | null = null

  try {
    units = await getDispensingUnits()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load dispensing units"
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Dispensing Units</h1>
        <p className="text-sm text-muted-foreground">
          Manage units used for product dispensing
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <DispensingUnitsTable units={units} />
      )}
    </div>
  )
}
