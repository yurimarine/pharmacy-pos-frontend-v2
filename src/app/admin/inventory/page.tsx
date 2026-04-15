import { redirect } from "next/navigation"
import { getInventory, getPharmaciesForSelect } from "./actions"
import { InventoryTable } from "@/components/inventory/InventoryTable"

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    pharmacy?: string
    page?: string
    search?: string
  }>
}) {
  const params = await searchParams

  const pharmacyId = params.pharmacy ?? undefined
  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20
  const search = params.search ?? undefined

  const pharmacies = await getPharmaciesForSelect()

  // Default to the first pharmacy on initial visit to prevent unbounded fetch
  if (!pharmacyId && pharmacies.length > 0) {
    redirect(`/admin/inventory?pharmacy=${pharmacies[0].id}`)
  }

  const { data: inventory, count } = await getInventory(
    pharmacyId,
    page,
    pageSize,
    search,
  )

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Track stock levels across pharmacies
        </p>
      </div>

      <InventoryTable
        inventory={inventory}
        pharmacies={pharmacies}
        totalCount={count}
        currentPage={page}
        pageSize={pageSize}
        selectedPharmacyId={pharmacyId ?? null}
        currentSearch={search ?? ""}
      />
    </div>
  )
}
