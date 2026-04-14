import { getProductCategories } from "./actions"
import { getProductClassesForSelect } from "@/app/admin/product-classes/actions"
import { ProductCategoriesTable } from "@/components/product-categories/ProductCategoriesTable"
import type { ProductCategory } from "@/types/reference-data"

export default async function ProductCategoriesPage() {
  let categories: ProductCategory[] = []
  let classes: { id: string; name: string }[] = []
  let fetchError: string | null = null

  try {
    ;[categories, classes] = await Promise.all([
      getProductCategories(),
      getProductClassesForSelect(),
    ])
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load product categories"
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Product Categories</h1>
        <p className="text-sm text-muted-foreground">
          Manage product categories grouped by class
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <ProductCategoriesTable categories={categories} classes={classes} />
      )}
    </div>
  )
}
