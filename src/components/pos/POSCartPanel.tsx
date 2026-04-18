'use client'

import { useState } from 'react'
import { ShoppingCartIcon } from 'lucide-react'
import { usePOS } from '@/context/POSContext'
import { POSCartItem } from './POSCartItem'
import { POSCartTotals } from './POSCartTotals'
import { POSPaymentSection } from './POSPaymentSection'
import { POSCartActions } from './POSCartActions'

type POSCartPanelProps = {
  pharmacyId: string
}

export function POSCartPanel({ pharmacyId }: POSCartPanelProps) {
  const { cartItems, itemCount, subtotal, totalAmount } = usePOS()
  const [amountTendered, setAmountTendered] = useState(0)

  const hasItems = cartItems.length > 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-muted/20">
      {/* Cart header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <ShoppingCartIcon className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">Cart</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {itemCount} item{itemCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Items list */}
      {hasItems ? (
        <div className="flex-1 overflow-y-auto px-4">
          {cartItems.map(item => (
            <POSCartItem key={item.inventoryId} item={item} />
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
        <POSCartTotals subtotal={subtotal} totalAmount={totalAmount} />
        <POSPaymentSection
          totalAmount={totalAmount}
          amountTendered={amountTendered}
          onAmountTenderedChange={setAmountTendered}
        />
        <POSCartActions
          pharmacyId={pharmacyId}
          amountTendered={amountTendered}
          onSaleComplete={() => setAmountTendered(0)}
        />
      </div>
    </div>
  )
}
