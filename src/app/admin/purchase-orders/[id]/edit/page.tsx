import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-current-user"
import { getPurchaseOrderById } from "@/app/admin/purchase-orders/actions"
import { getSuppliers } from "@/app/admin/suppliers/actions"
import { PurchaseOrderForm } from "@/components/purchase-orders/PurchaseOrderForm"

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [user, po, suppliers] = await Promise.all([
    getCurrentUser(),
    getPurchaseOrderById(id),
    getSuppliers(),
  ])

  if (!["admin", "pharmacist"].includes(user.role)) {
    redirect("/unauthorized")
  }

  if (!po) notFound()

  if (po.status !== "draft") {
    redirect("/admin/purchase-orders")
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PurchaseOrderForm
        mode="edit"
        po={po}
        suppliers={suppliers.map(s => ({ id: s.id, name: s.name }))}
      />
    </div>
  )
}
