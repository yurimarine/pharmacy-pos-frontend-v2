import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-current-user"
import { getWarehouseReceiptById } from "@/app/admin/warehouse-receipts/actions"
import { getSuppliers } from "@/app/admin/suppliers/actions"
import { getPurchaseOrders } from "@/app/admin/purchase-orders/actions"
import { WarehouseReceiptForm } from "@/components/warehouse-receipts/WarehouseReceiptForm"

export default async function EditWarehouseReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [user, receipt, suppliers, posResult] = await Promise.all([
    getCurrentUser(),
    getWarehouseReceiptById(id),
    getSuppliers(),
    getPurchaseOrders({ status: "submitted", pageSize: 100 }),
  ])

  if (user.role !== "admin") {
    redirect("/unauthorized")
  }

  if (!receipt) notFound()

  if (receipt.status !== "draft") {
    redirect("/admin/warehouse-receipts")
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <WarehouseReceiptForm
        mode="edit"
        receipt={receipt}
        suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))}
        submittedPOs={posResult.data}
      />
    </div>
  )
}
