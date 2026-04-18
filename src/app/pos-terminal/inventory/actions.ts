'use server'

import { createClient } from '@/lib/supabase/server'
import type { POSInventoryTableItem } from '@/types/inventory'

export async function getPOSInventoryForTable(
  pharmacyId: string,
): Promise<POSInventoryTableItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      product_id,
      quantity,
      selling_price,
      low_stock_threshold,
      expiry_date,
      last_restocked_at,
      products (
        id,
        name,
        generic_name,
        sku,
        requires_prescription,
        status,
        product_categories ( name ),
        packaging_units ( name, abbreviation ),
        dispensing_units ( name, abbreviation )
      )
    `)
    .eq('pharmacy_id', pharmacyId)
    .eq('is_active', true)
    .order('products(name)', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? [])
    .map(item => {
      const product = item.products as any
      if (!product || product.status === 'discontinued') return null
      return {
        id: item.id,
        productId: product.id as string,
        productName: product.name as string,
        productGenericName: (product.generic_name as string | null) ?? null,
        productSku: (product.sku as string | null) ?? null,
        category: (product.product_categories?.name as string | null) ?? null,
        requiresPrescription: (product.requires_prescription as boolean) ?? false,
        packagingLabel: product.packaging_units?.name
          ? (product.packaging_units.name as string)
          : null,
        dispensingUnit: product.dispensing_units?.abbreviation
          ? (product.dispensing_units.abbreviation as string)
          : null,
        quantity: item.quantity,
        sellingPrice: item.selling_price,
        lowStockThreshold: item.low_stock_threshold,
        expiryDate: item.expiry_date,
        lastRestockedAt: item.last_restocked_at,
      } satisfies POSInventoryTableItem
    })
    .filter(Boolean) as POSInventoryTableItem[]
}
