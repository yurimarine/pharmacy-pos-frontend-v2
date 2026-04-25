'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { SearchIcon, XCircleIcon, EllipsisVerticalIcon } from 'lucide-react'
import { toast } from 'sonner'
import { forceCloseTillSession } from '@/app/admin/till-sessions/actions'
import {
  type TillSessionWithRelations,
  type TillSessionStatus,
  TILL_SESSION_STATUS_LABELS,
} from '@/types/till-session'
import { ROLE_LABELS } from '@/types/user'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { TillSessionDetailDialog } from './TillSessionDetailDialog'

type Props = {
  data: TillSessionWithRelations[]
  count: number
  pharmacies: { id: string; name: string }[]
  currentPharmacyId?: string
  currentStatus?: string
  currentDateFrom?: string
  currentDateTo?: string
  currentSearch?: string
  currentPage: number
  pageSize: number
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function formatTimeShort(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function StatusBadge({ status }: { status: TillSessionStatus }) {
  if (status === 'open') {
    return (
      <Badge className="bg-green-500 hover:bg-green-500">
        {TILL_SESSION_STATUS_LABELS.open}
      </Badge>
    )
  }
  if (status === 'force_closed') {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500">
        {TILL_SESSION_STATUS_LABELS.force_closed}
      </Badge>
    )
  }
  return <Badge variant="secondary">{TILL_SESSION_STATUS_LABELS.closed}</Badge>
}

export function TillSessionsTable({
  data,
  count,
  pharmacies,
  currentPharmacyId = '',
  currentStatus = 'all',
  currentDateFrom = '',
  currentDateTo = '',
  currentSearch = '',
  currentPage,
  pageSize,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(currentSearch)
  const [dateFrom, setDateFrom] = useState(currentDateFrom)
  const [dateTo, setDateTo] = useState(currentDateTo)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [forceCloseTarget, setForceCloseTarget] =
    useState<TillSessionWithRelations | null>(null)
  const [viewingSession, setViewingSession] =
    useState<TillSessionWithRelations | null>(null)

  const hasActiveFilters =
    !!currentSearch ||
    (!!currentStatus && currentStatus !== 'all') ||
    !!currentDateFrom ||
    !!currentDateTo ||
    !!currentPharmacyId

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

  const handleSearch = useDebouncedCallback((value: string) => {
    updateParams({ search: value || null })
  }, 400)

  async function handleForceClose(sessionId: string) {
    setPendingIds((prev) => new Set([...prev, sessionId]))
    try {
      await forceCloseTillSession(sessionId)
      toast.success('Till session force closed.')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to force close session.'
      toast.error(message)
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(sessionId)
        return next
      })
    }
  }

  const totalPages = Math.ceil(count / pageSize)
  const startRow = (currentPage - 1) * pageSize + 1
  const endRow = Math.min(currentPage * pageSize, count)

  const columns = useMemo<ColumnDef<TillSessionWithRelations>[]>(
    () => [
      {
        id: 'pharmacy',
        header: 'Pharmacy',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.pharmacies?.name ?? '—'}</span>
        ),
      },
      {
        id: 'opened_by',
        header: 'Opened By',
        cell: ({ row }) => {
          const u = row.original.opened_by_user
          if (!u) return <span className="text-muted-foreground">—</span>
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{u.name}</span>
              <span className="text-xs text-muted-foreground">
                {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
              </span>
            </div>
          )
        },
      },
      {
        id: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDateShort(row.original.opened_at)}
          </span>
        ),
      },
      {
        id: 'time_in',
        header: 'Time In',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatTimeShort(row.original.opened_at)}
          </span>
        ),
      },
      {
        id: 'time_out',
        header: 'Time Out',
        cell: ({ row }) => {
          const { status, closed_at } = row.original
          if (!closed_at) return <span className="text-muted-foreground">—</span>
          if (status === 'force_closed') {
            return (
              <span className="text-sm tabular-nums">
                {formatTimeShort(closed_at)}{' '}
                <span className="text-amber-600 text-xs">(Auto)</span>
              </span>
            )
          }
          return (
            <span className="text-sm tabular-nums">
              {formatTimeShort(closed_at)}
            </span>
          )
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isOpen = row.original.status === 'open'
          const isPending = pendingIds.has(row.original.id)
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" disabled={isPending} />}
              >
                <EllipsisVerticalIcon className="size-4" />
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewingSession(row.original)}>
                  View
                </DropdownMenuItem>
                {isOpen && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setForceCloseTarget(row.original)}
                  >
                    Force Close
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [pendingIds],
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
              placeholder="Search by staff name..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                handleSearch(e.target.value)
              }}
              className="pl-8"
            />
          </div>

          {/* Pharmacy filter */}
          <Select
            value={currentPharmacyId || 'all'}
            onValueChange={(value: string | null) => {
              if (!value) return
              updateParams({ pharmacy: value === 'all' ? null : value })
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Pharmacies">
                {currentPharmacyId
                  ? (pharmacies.find((p) => p.id === currentPharmacyId)?.name ??
                    'All Pharmacies')
                  : 'All Pharmacies'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pharmacies</SelectItem>
              {pharmacies.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={currentStatus || 'all'}
            onValueChange={(value: string | null) => {
              if (!value) return
              updateParams({ status: value === 'all' ? null : value })
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Statuses">
                {currentStatus === 'open'
                  ? 'Open'
                  : currentStatus === 'closed'
                    ? 'Closed'
                    : currentStatus === 'force_closed'
                      ? 'Force Closed'
                      : 'All Statuses'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="force_closed">Force Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Date range */}
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              updateParams({ dateFrom: e.target.value || null })
            }}
            className="w-36"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              updateParams({ dateTo: e.target.value || null })
            }}
            className="w-36"
          />

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => {
                setSearchValue('')
                setDateFrom('')
                setDateTo('')
                startTransition(() => {
                  router.push(pathname)
                })
              }}
            >
              <XCircleIcon className="size-4" />
              Clear
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {count} {count === 1 ? 'session' : 'sessions'} found
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
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
                  No till sessions found.
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
            Showing {startRow}–{endRow} of {count} sessions
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() =>
                updateParams({ page: String(currentPage - 1) })
              }
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() =>
                updateParams({ page: String(currentPage + 1) })
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Session detail dialog */}
      <TillSessionDetailDialog
        session={viewingSession}
        open={viewingSession !== null}
        onOpenChange={(open) => {
          if (!open) setViewingSession(null)
        }}
      />

      {/* Force-close confirmation dialog */}
      <AlertDialog
        open={!!forceCloseTarget}
        onOpenChange={(open) => {
          if (!open) setForceCloseTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Close Till Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately close{' '}
              <strong>
                {forceCloseTarget?.opened_by_user?.name ?? 'this user'}
              </strong>
              &apos;s active till session at{' '}
              <strong>
                {forceCloseTarget?.pharmacies?.name ?? 'this pharmacy'}
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (forceCloseTarget) {
                  const id = forceCloseTarget.id
                  setForceCloseTarget(null)
                  handleForceClose(id)
                }
              }}
            >
              Force Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
