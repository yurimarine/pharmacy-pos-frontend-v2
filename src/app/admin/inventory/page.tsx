import { redirect } from "next/navigation"
import { getInventory, getPharmaciesForSelect } from "./actions"
import { getCurrentUser } from "@/lib/get-current-user"
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

  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20
  const search = params.search ?? undefined

  const [pharmacies, currentUser] = await Promise.all([
    getPharmaciesForSelect(),
    getCurrentUser(),
  ])

  const isAdminUser = currentUser.role === "admin"

  // Pharmacist with no pharmacy assigned — show error
  if (!isAdminUser && !currentUser.pharmacy_id) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        </div>
        <p className="text-muted-foreground">
          Your account is not assigned to a pharmacy. Contact your administrator.
        </p>
      </div>
    )
  }

  // Pharmacist trying to view a different pharmacy via URL — redirect to their own
  if (!isAdminUser && params.pharmacy && params.pharmacy !== currentUser.pharmacy_id) {
    redirect(`/admin/inventory?pharmacy=${currentUser.pharmacy_id}`)
  }

  // Determine active pharmacy ID
  const pharmacyId = isAdminUser
    ? (params.pharmacy ?? undefined)
    : (currentUser.pharmacy_id ?? undefined)

  // Admin: default to first pharmacy on initial visit
  if (isAdminUser && !params.pharmacy && pharmacies.length > 0) {
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
        userRole={currentUser.role}
        userPharmacyId={currentUser.pharmacy_id}
      />
    </div>
  )
}
