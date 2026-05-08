import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-current-user"
import { getStockTransferById } from "@/app/admin/stock-transfers/actions"
import { getPharmacies } from "@/app/admin/pharmacies/actions"
import { StockTransferForm } from "@/components/stock-transfers/StockTransferForm"

export default async function EditStockTransferPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [user, transfer, pharmacies] = await Promise.all([
    getCurrentUser(),
    getStockTransferById(id),
    getPharmacies(),
  ])

  if (user.role !== "admin") {
    redirect("/unauthorized")
  }

  if (!transfer) notFound()

  if (transfer.status !== "draft") {
    redirect("/admin/stock-transfers")
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <StockTransferForm
        mode="edit"
        transfer={transfer}
        pharmacies={pharmacies.map(p => ({ id: p.id, name: p.name }))}
      />
    </div>
  )
}
