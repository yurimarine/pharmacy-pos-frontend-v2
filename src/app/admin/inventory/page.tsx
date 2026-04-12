import { getInventory, getPharmaciesForSelect } from "./actions"
import { InventoryTable } from "@/components/inventory/InventoryTable"
import type { Inventory } from "@/types/inventory"

export default async function InventoryPage() {
  let inventory: Inventory[] = []
  let pharmacies: { id: string; name: string }[] = []
  let fetchError: string | null = null

  try {
    ;[inventory, pharmacies] = await Promise.all([
      getInventory(),
      getPharmaciesForSelect(),
    ])
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load inventory"
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Track stock levels across pharmacies
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <InventoryTable inventory={inventory} pharmacies={pharmacies} />
      )}
    </div>
  )
}
