import { ShoppingCartIcon } from 'lucide-react'
import { POSCartItem } from './POSCartItem'
import { POSCartTotals } from './POSCartTotals'
import { POSPaymentSection } from './POSPaymentSection'
import { POSCartActions } from './POSCartActions'

const MOCK_CART_ITEMS = [
  {
    id: '1',
    productName: 'Amoxicillin 500mg Capsule',
    genericName: 'Amoxicillin',
    sku: 'AMX-500-CAP',
    quantity: 2,
    unitPrice: 12.5,
    totalPrice: 25.0,
    maxQuantity: 240,
  },
  {
    id: '2',
    productName: 'Biogesic Paracetamol 500mg',
    genericName: 'Paracetamol',
    sku: 'BIO-500-TAB',
    quantity: 3,
    unitPrice: 6.75,
    totalPrice: 20.25,
    maxQuantity: 8,
  },
  {
    id: '3',
    productName: 'Cetirizine 10mg Tablet',
    genericName: 'Cetirizine Hydrochloride',
    sku: 'CET-010-TAB',
    quantity: 1,
    unitPrice: 9.25,
    totalPrice: 9.25,
    maxQuantity: 54,
  },
]

const MOCK_TOTALS = {
  subtotal: 54.5,
  discountAmount: 0,
  totalAmount: 54.5,
  amountTendered: 100,
  changeAmount: 45.5,
}

export function POSCartPanel() {
  const hasItems = MOCK_CART_ITEMS.length > 0
  const isValid = hasItems && MOCK_TOTALS.amountTendered >= MOCK_TOTALS.totalAmount

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-muted/20">
      {/* Cart header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <ShoppingCartIcon className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">
          Cart
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {MOCK_CART_ITEMS.length} item{MOCK_CART_ITEMS.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Items list */}
      {hasItems ? (
        <div className="flex-1 overflow-y-auto px-4">
          {MOCK_CART_ITEMS.map((item) => (
            <POSCartItem key={item.id} {...item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <ShoppingCartIcon className="size-10 opacity-30" />
          <p className="text-sm">Cart is empty</p>
          <p className="text-xs">Search for products to add</p>
        </div>
      )}

      {/* Footer: totals + payment + actions */}
      <div className="shrink-0 border-t px-4 pb-4">
        <POSCartTotals
          subtotal={MOCK_TOTALS.subtotal}
          discountAmount={MOCK_TOTALS.discountAmount}
          totalAmount={MOCK_TOTALS.totalAmount}
        />
        <POSPaymentSection
          totalAmount={MOCK_TOTALS.totalAmount}
          amountTendered={MOCK_TOTALS.amountTendered}
          changeAmount={MOCK_TOTALS.changeAmount}
        />
        <POSCartActions hasItems={hasItems} isValid={isValid} />
      </div>
    </div>
  )
}
