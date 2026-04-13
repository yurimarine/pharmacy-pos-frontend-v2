import { getBatches, getPharmaciesForBatchSelect } from "./actions"
import { BatchesTable } from "@/components/batches/BatchesTable"
import type { Batch } from "@/types/batch"

export default async function BatchesPage() {
  let batches: Batch[] = []
  let pharmacies: { id: string; name: string }[] = []
  let fetchError: string | null = null

  try {
    ;[batches, pharmacies] = await Promise.all([
      getBatches(),
      getPharmaciesForBatchSelect(),
    ])
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load batches"
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Batches</h1>
        <p className="text-sm text-muted-foreground">
          Manage stock in and stock out batch transactions
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <BatchesTable batches={batches} pharmacies={pharmacies} />
      )}
    </div>
  )
}
