import { notFound } from "next/navigation"
import { getProductById, getProductSuggestions } from "@/app/admin/products/actions"
import { ProductForm } from "@/components/products/ProductForm"

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [product, suggestions] = await Promise.all([
    getProductById(id),
    getProductSuggestions(),
  ])

  if (!product) notFound()

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <ProductForm mode="edit" product={product} suggestions={suggestions} />
    </div>
  )
}
