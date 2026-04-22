'use client'

import { useMemo } from 'react'
import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { usePOS } from '@/context/POSContext'
import { POSProductResultsList } from './POSProductResultsList'

export function POSSearchPanel() {
  const { inventory, searchQuery, setSearchQuery, addToCart } = usePOS()

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return inventory
    const q = searchQuery.toLowerCase()
    return inventory.filter(
      item =>
        item.productName.toLowerCase().includes(q) ||
        item.productGenericName?.toLowerCase().includes(q)
    )
  }, [inventory, searchQuery])

  const isEmpty = searchQuery.trim() !== '' && filtered.length === 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Search bar */}
      <div className="border-b p-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by product name or generic name..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3">
        <POSProductResultsList
          items={filtered}
          onAddToCart={addToCart}
          isEmpty={isEmpty}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  )
}
