import { getManufacturers } from "./actions"
import { ManufacturersTable } from "@/components/manufacturers/ManufacturersTable"
import type { Manufacturer } from "@/types/manufacturer"

export default async function ManufacturersPage() {
  let manufacturers: Manufacturer[] = []
  let fetchError: string | null = null

  try {
    manufacturers = await getManufacturers()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load manufacturers"
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Manufacturers</h1>
        <p className="text-sm text-muted-foreground">
          Manage your pharmacy product manufacturers
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <ManufacturersTable manufacturers={manufacturers} />
      )}
    </div>
  )
}
