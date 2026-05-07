import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-current-user"
import { getPharmacies } from "@/app/admin/pharmacies/actions"
import { StockTransferForm } from "@/components/stock-transfers/StockTransferForm"

export default async function NewStockTransferPage() {
  const [user, pharmacies] = await Promise.all([
    getCurrentUser(),
    getPharmacies(),
  ])

  if (user.role !== "admin") {
    redirect("/unauthorized")
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <StockTransferForm
        mode="create"
        pharmacies={pharmacies.map(p => ({ id: p.id, name: p.name }))}
      />
    </div>
  )
}
