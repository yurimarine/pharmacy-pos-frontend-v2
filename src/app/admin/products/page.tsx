import { getProducts } from "./actions"
import { ProductsTable } from "@/components/products/ProductsTable"
import type { Product } from "@/types/product"

export default async function ProductsPage() {
  let products: Product[] = []
  let fetchError: string | null = null

  try {
    products = await getProducts()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load products"
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your pharmacy product catalog
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <ProductsTable products={products} />
      )}
    </div>
  )
}
