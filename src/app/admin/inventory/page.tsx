import { redirect } from "next/navigation"
import { getPharmacyInventory } from "./actions"
import { getPharmacies } from "@/app/admin/pharmacies/actions"
import { getCurrentUser } from "@/lib/get-current-user"
import PharmacyInventoryTable from "@/components/inventory/PharmacyInventoryTable"
import type { StockStatus } from "@/types/inventory"

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    pharmacy_id?: string
    search?: string
    status?: string
    requires_prescription?: string
    page?: string
  }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20

  const [currentUser, pharmacies] = await Promise.all([
    getCurrentUser(),
    getPharmacies(),
  ])

  const isAdmin = currentUser.role === "admin"

  if (!isAdmin && !currentUser.pharmacy_id) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Pharmacy Inventory</h1>
        <p className="text-muted-foreground">
          Your account is not assigned to a pharmacy. Contact your administrator.
        </p>
      </div>
    )
  }

  // Non-admin trying to view a different pharmacy via URL — redirect to their own
  if (
    !isAdmin &&
    params.pharmacy_id &&
    params.pharmacy_id !== currentUser.pharmacy_id
  ) {
    redirect(`/admin/inventory?pharmacy_id=${currentUser.pharmacy_id}`)
  }

  // Determine active pharmacy
  let pharmacyId: string | undefined
  if (isAdmin) {
    pharmacyId = params.pharmacy_id ?? pharmacies[0]?.id
    if (!params.pharmacy_id && pharmacies.length > 0) {
      redirect(`/admin/inventory?pharmacy_id=${pharmacies[0].id}`)
    }
  } else {
    pharmacyId = currentUser.pharmacy_id ?? undefined
  }

  if (!pharmacyId) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Pharmacy Inventory</h1>
        <p className="text-muted-foreground">No pharmacy available.</p>
      </div>
    )
  }

  const requiresPrescription =
    params.requires_prescription === "true"
      ? true
      : params.requires_prescription === "false"
        ? false
        : undefined

  const { data, count } = await getPharmacyInventory({
    pharmacy_id: pharmacyId,
    search: params.search,
    status: params.status as StockStatus | undefined,
    requires_prescription: requiresPrescription,
    page,
    pageSize,
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Pharmacy Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stock levels and pricing per pharmacy
        </p>
      </div>

      <PharmacyInventoryTable
        data={data}
        count={count}
        page={page}
        pageSize={pageSize}
        pharmacy_id={pharmacyId}
        search={params.search}
        status={(params.status as StockStatus) || undefined}
        requires_prescription={requiresPrescription}
        pharmacies={pharmacies.map((p) => ({ id: p.id, name: p.name }))}
        userRole={currentUser.role}
        userPharmacyId={currentUser.pharmacy_id}
      />
    </div>
  )
}
