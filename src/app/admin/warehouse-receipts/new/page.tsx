import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-current-user"
import { getSuppliers } from "@/app/admin/suppliers/actions"
import { getPurchaseOrders } from "@/app/admin/purchase-orders/actions"
import { WarehouseReceiptForm } from "@/components/warehouse-receipts/WarehouseReceiptForm"

export default async function NewWarehouseReceiptPage() {
  const [user, suppliers, posResult] = await Promise.all([
    getCurrentUser(),
    getSuppliers(),
    getPurchaseOrders({ status: "submitted", pageSize: 100 }),
  ])

  if (user.role !== "admin") {
    redirect("/unauthorized")
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <WarehouseReceiptForm
        mode="create"
        suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))}
        submittedPOs={posResult.data}
      />
    </div>
  )
}
