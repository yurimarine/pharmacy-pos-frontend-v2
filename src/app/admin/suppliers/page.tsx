import { getSuppliers } from "./actions"
import { SuppliersTable } from "@/components/suppliers/SuppliersTable"
import { Button } from "@/components/ui/button"
import type { Supplier } from "@/types/supplier"

export default async function SuppliersPage() {
  let suppliers: Supplier[] = []
  let fetchError: string | null = null

  try {
    suppliers = await getSuppliers()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load suppliers"
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your pharmacy suppliers
          </p>
        </div>
        <Button>+ Add Supplier</Button>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <SuppliersTable suppliers={suppliers} />
      )}
    </div>
  )
}
