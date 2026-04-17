import { POSProductCard } from './POSProductCard'

const MOCK_PRODUCTS = [
  {
    id: '1',
    productName: 'Amoxicillin 500mg Capsule',
    genericName: 'Amoxicillin',
    sku: 'AMX-500-CAP',
    sellingPrice: 12.5,
    quantity: 240,
    stockStatus: 'in_stock' as const,
    requiresPrescription: true,
  },
  {
    id: '2',
    productName: 'Biogesic Paracetamol 500mg',
    genericName: 'Paracetamol',
    sku: 'BIO-500-TAB',
    sellingPrice: 6.75,
    quantity: 8,
    stockStatus: 'low_stock' as const,
    requiresPrescription: false,
  },
  {
    id: '3',
    productName: 'Losartan 50mg Tablet',
    genericName: 'Losartan Potassium',
    sku: 'LOS-050-TAB',
    sellingPrice: 18.0,
    quantity: 0,
    stockStatus: 'out_of_stock' as const,
    requiresPrescription: true,
  },
  {
    id: '4',
    productName: 'Cetirizine 10mg Tablet',
    genericName: 'Cetirizine Hydrochloride',
    sku: 'CET-010-TAB',
    sellingPrice: 9.25,
    quantity: 54,
    stockStatus: 'in_stock' as const,
    requiresPrescription: false,
  },
]

export function POSProductResultsList() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground mb-1">
        {MOCK_PRODUCTS.length} results
      </p>
      {MOCK_PRODUCTS.map((product) => (
        <POSProductCard key={product.id} {...product} />
      ))}
    </div>
  )
}
