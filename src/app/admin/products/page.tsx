import { getProducts } from "./actions"
import { getCurrentUser } from "@/lib/get-current-user"
import { ProductsTable } from "@/components/products/ProductsTable"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}) {
  const params = await searchParams

  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20
  const search = params.search ?? undefined

  const [{ data: products, count }, currentUser] = await Promise.all([
    getProducts(page, pageSize, search),
    getCurrentUser(),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your pharmacy product catalog
        </p>
      </div>

      <ProductsTable
        products={products}
        totalCount={count}
        currentPage={page}
        pageSize={pageSize}
        currentSearch={search ?? ""}
        userRole={currentUser.role}
      />
    </div>
  )
}
