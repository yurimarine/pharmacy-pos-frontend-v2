import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-current-user"
import { getSuppliers } from "@/app/admin/suppliers/actions"
import { PurchaseOrderForm } from "@/components/purchase-orders/PurchaseOrderForm"

export default async function NewPurchaseOrderPage() {
  const [user, suppliers] = await Promise.all([
    getCurrentUser(),
    getSuppliers(),
  ])

  if (!["admin", "pharmacist"].includes(user.role)) {
    redirect("/unauthorized")
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PurchaseOrderForm
        mode="create"
        suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))}
      />
    </div>
  )
}
