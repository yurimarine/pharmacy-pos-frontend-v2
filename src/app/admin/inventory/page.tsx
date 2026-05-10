import { redirect } from "next/navigation"
import { getPharmacyInventory, getInventoryStats } from "./actions"
import { getPharmacies } from "@/app/admin/pharmacies/actions"
import { getCurrentUser } from "@/lib/get-current-user"
import PharmacyInventoryTable from "@/components/inventory/PharmacyInventoryTable"
import InitializeInventoryButton from "@/components/inventory/InitializeInventoryButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  const [{ data, count }, stats] = await Promise.all([
    getPharmacyInventory({
      pharmacy_id: pharmacyId,
      search: params.search,
      status: params.status as StockStatus | undefined,
      requires_prescription: requiresPrescription,
      page,
      pageSize,
    }),
    getInventoryStats(pharmacyId),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Pharmacy Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stock levels and pricing per pharmacy
          </p>
        </div>
        {isAdmin && <InitializeInventoryButton pharmacyId={pharmacyId} />}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{stats.outOfStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.lowStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Near Expiry</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.nearExpiry}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
          </CardContent>
        </Card>
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
