"use client"

import { useState, useRef, useEffect } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ChevronsUpDownIcon, XIcon, SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type ProductOption = {
  id: string
  name: string
  generic_name: string | null
  base_price: number
  current_quantity?: number
  current_markup?: number
  current_selling_price?: number
}

export type ProductComboboxProps = {
  options: ProductOption[]
  value: string
  onChange: (product: ProductOption | null) => void
  placeholder?: string
  disabled?: boolean
}

export function ProductCombobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedProduct = options.find(p => p.id === value) ?? null

  const filteredOptions = options.filter(p => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.generic_name?.toLowerCase().includes(q) ?? false)
    )
  })

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setSearch("")
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal text-left h-9"
          />
        }
      >
        {selectedProduct ? (
          <span className="truncate">{selectedProduct.name}</span>
        ) : (
          <span className="text-muted-foreground truncate">
            {placeholder ?? "Search products..."}
          </span>
        )}
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {selectedProduct && (
            <span
              role="button"
              tabIndex={0}
              onClick={e => {
                e.stopPropagation()
                onChange(null)
                setSearch("")
              }}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  onChange(null)
                  setSearch("")
                }
              }}
              className="rounded-sm p-0.5 hover:bg-muted text-muted-foreground"
            >
              <XIcon className="h-3 w-3" />
            </span>
          )}
          <ChevronsUpDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-(--anchor-width) min-w-64 max-w-sm"
        align="start"
      >
        <div className="flex items-center border-b px-3">
          <SearchIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-2" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-60 overflow-y-auto py-1">
          {filteredOptions.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No products found.
            </div>
          )}
          {filteredOptions.map(product => (
            <button
              key={product.id}
              onClick={() => {
                onChange(product)
                setOpen(false)
                setSearch("")
              }}
              className={cn(
                "w-full flex flex-col items-start px-3 py-2",
                "text-sm hover:bg-muted transition-colors text-left",
                value === product.id && "bg-muted",
              )}
            >
              <span className="font-medium truncate w-full">{product.name}</span>
              {product.generic_name && (
                <span className="text-xs text-muted-foreground truncate w-full">
                  {product.generic_name}
                </span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
