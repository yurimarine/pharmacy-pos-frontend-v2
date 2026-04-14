import { getProductClasses } from "./actions"
import { ProductClassesTable } from "@/components/product-classes/ProductClassesTable"
import type { ProductClass } from "@/types/reference-data"

export default async function ProductClassesPage() {
  let classes: ProductClass[] = []
  let fetchError: string | null = null

  try {
    classes = await getProductClasses()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load product classes"
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Product Classes</h1>
        <p className="text-sm text-muted-foreground">
          Manage product classification groups
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {fetchError}
        </div>
      ) : (
        <ProductClassesTable classes={classes} />
      )}
    </div>
  )
}
