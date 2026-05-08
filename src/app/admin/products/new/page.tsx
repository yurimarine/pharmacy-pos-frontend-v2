import { getProductSuggestions } from "@/app/admin/products/actions"
import { ProductForm } from "@/components/products/ProductForm"

export default async function NewProductPage() {
  const suggestions = await getProductSuggestions()

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <ProductForm mode="create" suggestions={suggestions} />
    </div>
  )
}
