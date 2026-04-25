'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  SearchIcon,
  XCircleIcon,
  PencilIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  CheckIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { toggleDiscountActive } from '@/app/admin/discounts/actions'
import {
  type Discount,
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_SCOPE_LABELS,
} from '@/types/discount'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { EditDiscountModal } from './EditDiscountModal'

type Props = {
  data: Discount[]
  count: number
  currentSearch?: string
  currentScope?: string
  currentType?: string
  currentIsActive?: string
  currentPage: number
  pageSize: number
  onAddClick: () => void
}

export function DiscountsTable({
  data,
  count,
  currentSearch = '',
  currentScope = 'all',
  currentType = 'all',
  currentIsActive = 'all',
  currentPage,
  pageSize,
  onAddClick,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(currentSearch)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Discount | null>(null)

  const hasActiveFilters =
    !!currentSearch ||
    (!!currentScope && currentScope !== 'all') ||
    (!!currentType && currentType !== 'all') ||
    (!!currentIsActive && currentIsActive !== 'all')

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      if (!('page' in updates)) {
        params.set('page', '1')
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [searchParams, pathname, router],
  )

  const handleSearch = useDebouncedCallback((val: string) => {
    updateParams({ search: val || null })
  }, 400)

  async function handleToggle(id: string, currentStatus: boolean) {
    try {
      await toggleDiscountActive(id, currentStatus)
      toast.success(currentStatus ? 'Discount deactivated.' : 'Discount activated.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update.')
    }
  }

  const totalPages = Math.ceil(count / pageSize)
  const startRow = (currentPage - 1) * pageSize + 1
  const endRow = Math.min(currentPage * pageSize, count)

  const columns = useMemo<ColumnDef<Discount>[]>(
    () => [
      {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.name}</span>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const d = row.original
          if (d.type === 'percentage') {
            return (
              <Badge variant="secondary">
                {d.value}%
              </Badge>
            )
          }
          return (
            <Badge variant="outline">
              ₱{d.value.toFixed(2)}
            </Badge>
          )
        },
      },
      {
        id: 'scope',
        header: 'Scope',
        cell: ({ row }) => (
          <Badge variant="outline">
            {DISCOUNT_SCOPE_LABELS[row.original.scope]}
          </Badge>
        ),
      },
      {
        id: 'requires_reference',
        header: 'Requires ID',
        cell: ({ row }) =>
          row.original.requires_reference ? (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckIcon className="size-3.5" />
              Yes
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge className="bg-green-500 hover:bg-green-500">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingDiscount(row.original)}
                  />
                }
              >
                <PencilIcon className="size-4" />
                <span className="sr-only">Edit discount</span>
              </TooltipTrigger>
              <TooltipContent>Edit discount</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setToggleTarget(row.original)}
                  />
                }
              >
                {row.original.is_active ? (
                  <ToggleRightIcon className="size-4 text-green-600" />
                ) : (
                  <ToggleLeftIcon className="size-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {row.original.is_active ? 'Deactivate' : 'Activate'}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {row.original.is_active ? 'Deactivate' : 'Activate'}
              </TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-56">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search discounts..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                handleSearch(e.target.value)
              }}
              className="pl-8"
            />
          </div>

          {/* Scope filter */}
          <Select
            value={currentScope || 'all'}
            onValueChange={(v: string | null) => {
              if (!v) return
              updateParams({ scope: v === 'all' ? null : v })
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Scopes">
                {currentScope === 'per_item'
                  ? 'Per Item'
                  : currentScope === 'whole_cart'
                    ? 'Whole Cart'
                    : 'All Scopes'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              <SelectItem value="per_item">Per Item</SelectItem>
              <SelectItem value="whole_cart">Whole Cart</SelectItem>
            </SelectContent>
          </Select>

          {/* Type filter */}
          <Select
            value={currentType || 'all'}
            onValueChange={(v: string | null) => {
              if (!v) return
              updateParams({ type: v === 'all' ? null : v })
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Types">
                {currentType === 'percentage'
                  ? 'Percentage'
                  : currentType === 'fixed'
                    ? 'Fixed Amount'
                    : 'All Types'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={currentIsActive || 'all'}
            onValueChange={(v: string | null) => {
              if (!v) return
              updateParams({ isActive: v === 'all' ? null : v })
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Statuses">
                {currentIsActive === 'true'
                  ? 'Active'
                  : currentIsActive === 'false'
                    ? 'Inactive'
                    : 'All Statuses'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => {
                setSearchValue('')
                startTransition(() => {
                  router.push(pathname)
                })
              }}
            >
              <XCircleIcon className="size-4" />
              Clear
            </Button>
          )}

          <Button className="ml-auto" onClick={onAddClick}>
            Add Discount
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {count} {count === 1 ? 'discount' : 'discounts'} found
        </p>
      </div>

      {/* Table */}
      <div
        className={`rounded-md border overflow-x-auto transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No discounts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Showing {startRow}–{endRow} of {count} discounts
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => updateParams({ page: String(currentPage - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => updateParams({ page: String(currentPage + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      <EditDiscountModal
        open={editingDiscount !== null}
        onOpenChange={(open) => {
          if (!open) setEditingDiscount(null)
        }}
        discount={editingDiscount}
      />

      {/* Toggle active confirmation */}
      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={(open) => {
          if (!open) setToggleTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.is_active
                ? 'Deactivate Discount?'
                : 'Activate Discount?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.is_active ? (
                <>
                  Deactivating{' '}
                  <strong>&ldquo;{toggleTarget.name}&rdquo;</strong> will
                  prevent it from being applied at the POS. Existing
                  transactions using this discount will not be affected.
                </>
              ) : (
                <>
                  Activating{' '}
                  <strong>&ldquo;{toggleTarget?.name}&rdquo;</strong> will
                  make it available for use at the POS terminal.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                toggleTarget?.is_active
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
              onClick={() => {
                if (toggleTarget) {
                  const { id, is_active } = toggleTarget
                  setToggleTarget(null)
                  handleToggle(id, is_active)
                }
              }}
            >
              {toggleTarget?.is_active ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
