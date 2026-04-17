'use client'

import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { POSProductResultsList } from './POSProductResultsList'

export function POSSearchPanel() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Search bar */}
      <div className="border-b p-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, generic name, or SKU..."
            className="pl-9"
            readOnly
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-3">
        <POSProductResultsList />
      </div>
    </div>
  )
}
