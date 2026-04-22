'use client'

import { getStockStatus } from '@/lib/inventory-utils'
import type { POSInventoryItem } from '@/context/POSContext'
import { POSProductCard } from './POSProductCard'

type POSProductResultsListProps = {
  items: POSInventoryItem[]
  onAddToCart: (item: POSInventoryItem) => void
  isEmpty: boolean
  searchQuery: string
}

export function POSProductResultsList({
  items,
  onAddToCart,
  isEmpty,
  searchQuery,
}: POSProductResultsListProps) {
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No products found for &ldquo;{searchQuery}&rdquo;</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No products available in inventory.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground mb-1">
        {items.length} {items.length === 1 ? 'result' : 'results'}
      </p>
      {items.map(item => {
        const stockStatus = getStockStatus(
          item.quantity,
          item.lowStockThreshold,
          item.expiryDate,
        )
        return (
          <POSProductCard
            key={item.inventoryId}
            item={item}
            stockStatus={stockStatus}
            onAddToCart={() => onAddToCart(item)}
          />
        )
      })}
    </div>
  )
}
