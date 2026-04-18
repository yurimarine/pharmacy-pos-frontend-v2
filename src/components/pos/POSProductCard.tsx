'use client'

import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StockStatus } from '@/types/inventory'
import type { POSInventoryItem } from '@/context/POSContext'

type POSProductCardProps = {
  item: POSInventoryItem
  stockStatus: StockStatus
  onAddToCart: () => void
}

function StockIndicator({
  status,
  quantity,
}: {
  status: StockStatus
  quantity: number
}) {
  if (status === 'out_of_stock') {
    return <span className="text-xs text-destructive font-medium">Out of Stock</span>
  }
  if (status === 'expired') {
    return <span className="text-xs text-destructive font-medium">Expired</span>
  }
  if (status === 'low_stock') {
    return (
      <span className="text-xs text-yellow-600 font-medium">
        ⚠ {quantity} units
      </span>
    )
  }
  if (status === 'near_expiry') {
    return (
      <span className="text-xs text-orange-600 font-medium">
        ⚠ {quantity} units · Near Expiry
      </span>
    )
  }
  // in_stock
  return (
    <span className="text-xs text-green-600 font-medium">
      ✓ {quantity} units
    </span>
  )
}

export function POSProductCard({ item, stockStatus, onAddToCart }: POSProductCardProps) {
  const isDisabled = stockStatus === 'out_of_stock' || stockStatus === 'expired'

  return (
    <div
      className={`flex items-center justify-between rounded-lg border bg-card p-3 gap-3 transition-colors ${
        isDisabled ? 'opacity-50' : 'hover:bg-accent/30 cursor-pointer'
      }`}
      onClick={isDisabled ? undefined : onAddToCart}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-sm leading-tight truncate">
            {item.productName}
          </span>
          {item.requiresPrescription && (
            <Badge variant="outline" className="text-xs shrink-0">
              Rx
            </Badge>
          )}
        </div>
        {item.productGenericName && (
          <span className="text-xs text-muted-foreground truncate">
            {item.productGenericName}
          </span>
        )}
        {item.productSku && (
          <span className="font-mono text-xs text-muted-foreground">
            {item.productSku}
          </span>
        )}
        {item.packagingLabel && (
          <span className="text-xs text-muted-foreground">
            {item.packagingLabel}
          </span>
        )}
        <div className="mt-0.5">
          <StockIndicator status={stockStatus} quantity={item.quantity} />
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="font-semibold text-sm">
          ₱{item.sellingPrice.toFixed(2)}
        </span>
        <Button
          size="sm"
          disabled={isDisabled}
          className="gap-1"
          onClick={e => {
            e.stopPropagation()
            if (!isDisabled) onAddToCart()
          }}
        >
          <PlusIcon className="size-3" />
          Add
        </Button>
      </div>
    </div>
  )
}
