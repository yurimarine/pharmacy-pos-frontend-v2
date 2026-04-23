'use client'

import type { RefObject } from 'react'
import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { usePOS, type POSInventoryItem } from '@/context/POSContext'
import { POSProductResultsList } from './POSProductResultsList'

type POSSearchPanelProps = {
  searchInputRef: RefObject<HTMLInputElement | null>
  filteredItems: POSInventoryItem[]
  focusedProductIndex: number
  setFocusedProductIndex: (i: number) => void
  onSelectProduct: (item: POSInventoryItem) => void
}

export function POSSearchPanel({
  searchInputRef,
  filteredItems,
  focusedProductIndex,
  setFocusedProductIndex,
  onSelectProduct: _onSelectProduct,
}: POSSearchPanelProps) {
  const { searchQuery, setSearchQuery, addToCart } = usePOS()

  const isEmpty = searchQuery.trim() !== '' && filteredItems.length === 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Search bar */}
      <div className="border-b p-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search by product name or generic name... (F2)"
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3">
        <POSProductResultsList
          items={filteredItems}
          onAddToCart={addToCart}
          isEmpty={isEmpty}
          searchQuery={searchQuery}
          focusedProductIndex={focusedProductIndex}
          setFocusedProductIndex={setFocusedProductIndex}
        />
      </div>
    </div>
  )
}
