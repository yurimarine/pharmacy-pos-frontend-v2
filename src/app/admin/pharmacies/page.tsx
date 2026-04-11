import { getPharmacies } from "./actions"
import { PharmaciesTable } from "@/components/pharmacies/PharmaciesTable"
import { Button } from "@/components/ui/button"
import type { Pharmacy } from "@/types/pharmacy"

export default async function PharmaciesPage() {
  let pharmacies: Pharmacy[] = []
  let fetchError: string | null = null

  try {
    pharmacies = await getPharmacies()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load pharmacies"
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Pharmacies</h1>
          <p className="text-sm text-muted-foreground">
            Manage your registered pharmacy branches
          </p>
        </div>
        <Button>+ Add Pharmacy</Button>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <PharmaciesTable pharmacies={pharmacies} />
      )}
    </div>
  )
}
