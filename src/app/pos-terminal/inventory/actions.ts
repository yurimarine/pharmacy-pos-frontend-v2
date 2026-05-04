'use server'

import { createClient } from '@/lib/supabase/server'
import type { POSInventoryTableItem } from '@/types/inventory'

export async function getPOSInventoryForTable(
  pharmacyId: string,
): Promise<POSInventoryTableItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pharmacy_inventory')
    .select(`
      id,
      product_id,
      quantity,
      selling_price,
      low_stock_threshold,
      expiry_date,
      last_restocked_at,
      product:products!pharmacy_inventory_product_id_fkey (
        id,
        product_name,
        generic_name,
        sku,
        requires_prescription,
        status,
        packaging_type
      )
    `)
    .eq('pharmacy_id', pharmacyId)

  if (error) throw new Error(error.message)

  return (data ?? [])
    .map(item => {
      const product = item.product as unknown as {
        id: string
        product_name: string
        generic_name: string | null
        sku: string | null
        requires_prescription: boolean
        status: string
        packaging_type: string
      } | null
      if (!product || product.status !== 'active') return null
      return {
        id: item.id,
        productId: product.id,
        productName: product.product_name,
        productGenericName: product.generic_name ?? null,
        productSku: product.sku ?? null,
        category: null,
        requiresPrescription: product.requires_prescription ?? false,
        packagingLabel: product.packaging_type ?? null,
        dispensingUnit: null,
        quantity: item.quantity,
        sellingPrice: Number(item.selling_price),
        lowStockThreshold: item.low_stock_threshold,
        expiryDate: item.expiry_date,
        lastRestockedAt: item.last_restocked_at,
      } satisfies POSInventoryTableItem
    })
    .filter(Boolean) as POSInventoryTableItem[]
}
