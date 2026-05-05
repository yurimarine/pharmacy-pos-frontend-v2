import { getCurrentUser } from "@/lib/get-current-user"
import { getProducts } from "./actions"
import { ProductsTable } from "@/components/products/ProductsTable"
import type { ProductType, ProductStatus } from "@/types/product"

const VALID_TYPES: ProductType[] = ["generic", "branded", "otc"]
const VALID_STATUSES: ProductStatus[] = ["active", "inactive", "discontinued"]

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    type?: string
    status?: string
    category?: string
    requires_prescription?: string
    page?: string
  }>
}) {
  const params = await searchParams

  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20
  const search = params.search
  const type = VALID_TYPES.includes(params.type as ProductType)
    ? (params.type as ProductType)
    : undefined
  const status = VALID_STATUSES.includes(params.status as ProductStatus)
    ? (params.status as ProductStatus)
    : undefined
  const category = params.category
  const requires_prescription =
    params.requires_prescription === "true"
      ? true
      : params.requires_prescription === "false"
        ? false
        : undefined

  const [{ data, count }, currentUser] = await Promise.all([
    getProducts({ search, type, status, category, requires_prescription, page, pageSize }),
    getCurrentUser(),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
      </div>

      <ProductsTable
        data={data}
        count={count}
        page={page}
        pageSize={pageSize}
        search={search}
        type={type ?? ""}
        status={status ?? ""}
        category={category}
        requires_prescription={requires_prescription}
        userRole={currentUser.role}
      />
    </div>
  )
}
