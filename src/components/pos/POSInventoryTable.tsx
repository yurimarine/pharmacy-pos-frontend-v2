'use client'

import { useState, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table'
import { SearchIcon, SlidersHorizontalIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getStockStatus, stockStatusConfig } from '@/lib/inventory-utils'
import type { POSInventoryTableItem } from '@/types/inventory'

type POSInventoryTableProps = {
  inventory: POSInventoryTableItem[]
}

const COLUMN_LABELS: Record<string, string> = {
  product_name: 'Product Name',
  generic_name: 'Generic Name',
  category: 'Category',
  sku: 'SKU',
  quantity: 'Stock',
  status: 'Status',
  selling_price: 'Price',
  expiry_date: 'Expiry Date',
}

export function POSInventoryTable({ inventory }: POSInventoryTableProps) {
  const [searchValue, setSearchValue] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    category: false,
    sku: false,
    selling_price: false,
  })

  const filtered = useMemo(() => {
    if (!searchValue.trim()) return inventory
    const q = searchValue.toLowerCase()
    return inventory.filter(
      item =>
        item.productName.toLowerCase().includes(q) ||
        (item.productGenericName?.toLowerCase().includes(q) ?? false),
    )
  }, [inventory, searchValue])

  const columns = useMemo<ColumnDef<POSInventoryTableItem>[]>(
    () => [
      {
        id: 'product_name',
        header: 'Product Name',
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.productName}</span>
            {row.original.requiresPrescription && (
              <Badge
                variant="outline"
                className="w-fit text-xs px-1 h-4 border-blue-400 text-blue-600"
              >
                Rx
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: 'generic_name',
        header: 'Generic Name',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.productGenericName ?? '—'}
          </span>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        cell: ({ row }) => <span>{row.original.category ?? '—'}</span>,
      },
      {
        id: 'sku',
        header: 'SKU',
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.productSku ?? '—'}
          </span>
        ),
      },
      {
        id: 'quantity',
        header: 'Stock',
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            {row.original.quantity}
            {row.original.dispensingUnit ? ` ${row.original.dispensingUnit}` : ''}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = getStockStatus(
            row.original.quantity,
            row.original.lowStockThreshold,
            row.original.expiryDate,
          )
          const config = stockStatusConfig[status]
          return (
            <Badge
              variant={config.variant as 'default' | 'secondary' | 'destructive' | 'outline'}
              className={config.className}
            >
              {config.label}
            </Badge>
          )
        },
      },
      {
        id: 'selling_price',
        header: 'Price',
        cell: ({ row }) => (
          <span className="tabular-nums">₱{row.original.sellingPrice.toFixed(2)}</span>
        ),
      },
      {
        id: 'expiry_date',
        header: 'Expiry Date',
        cell: ({ row }) => {
          if (!row.original.expiryDate) {
            return <span className="text-muted-foreground">—</span>
          }
          const expiry = new Date(row.original.expiryDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const isExpired = expiry < today
          const daysUntil = Math.ceil(
            (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          )
          const isNearExpiry = daysUntil <= 60 && !isExpired

          return (
            <span
              className={
                isExpired
                  ? 'text-destructive font-medium'
                  : isNearExpiry
                    ? 'text-orange-600 font-medium'
                    : ''
              }
            >
              {expiry.toLocaleDateString('en-PH', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )
        },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  })

  const visibleColumns = table.getAllColumns().filter(col => col.getCanHide())

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={e => {
              setSearchValue(e.target.value)
              table.setPageIndex(0)
            }}
            placeholder="Search by name or generic name..."
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <SlidersHorizontalIcon className="h-4 w-4 mr-2" />
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {visibleColumns.map(col => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.getIsVisible()}
                onCheckedChange={value => col.toggleVisibility(!!value)}
              >
                {COLUMN_LABELS[col.id] ?? col.id.replace(/_/g, ' ')}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Count label */}
      <p className="text-sm text-muted-foreground flex-shrink-0">
        {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
        {searchValue && ` for "${searchValue}"`}
      </p>

      {/* Table — scrollable */}
      <div className="flex-1 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12 text-muted-foreground"
                >
                  {searchValue
                    ? `No products found for "${searchValue}"`
                    : 'No inventory items found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between flex-shrink-0">
        <p className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {Math.max(1, table.getPageCount())}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
