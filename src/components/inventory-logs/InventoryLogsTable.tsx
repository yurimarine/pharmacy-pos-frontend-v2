"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { SearchIcon, ScrollTextIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  InventoryLogWithDetails,
  InventoryLogEntityType,
  InventoryLogAction,
} from "@/types/inventory"
import { ROLE_LABELS } from "@/types/user"

const ACTION_LABELS: Record<InventoryLogAction, string> = {
  received: "Received",
  transferred_out: "Transferred Out",
  transferred_in: "Transferred In",
  adjusted: "Adjusted",
  sold: "Sold",
  voided: "Voided",
}

const ACTION_BADGE_CLASS: Record<InventoryLogAction, string> = {
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-0",
  transferred_out: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-0",
  transferred_in: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-0",
  adjusted: "border-yellow-500 text-yellow-700 dark:text-yellow-400",
  sold: "bg-primary text-primary-foreground border-0",
  voided: "",
}

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  receipt: "RECEIPT",
  transfer: "TRANSFER",
  adjustment: "ADJUST",
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function PaginationControls({
  page,
  pageSize,
  count,
  onPageChange,
}: {
  page: number
  pageSize: number
  count: number
  onPageChange: (p: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {count === 0
          ? "No results"
          : `Showing ${Math.min((page - 1) * pageSize + 1, count)}–${Math.min(page * pageSize, count)} of ${count} logs`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="min-w-[4rem] text-center">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default function InventoryLogsTable({
  data,
  count,
  page,
  pageSize,
  search,
  entity_type,
  action,
  date_from,
  date_to,
}: {
  data: InventoryLogWithDetails[]
  count: number
  page: number
  pageSize: number
  search?: string
  entity_type?: InventoryLogEntityType
  action?: InventoryLogAction
  date_from?: string
  date_to?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(search ?? "")

  const hasFilters =
    !!search || !!entity_type || !!action || !!date_from || !!date_to

  function pushParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined || val === "") {
        params.delete(key)
      } else {
        params.set(key, val)
      }
    }
    params.delete("page")
    startTransition(() => router.push(`?${params.toString()}`))
  }

  const handleSearch = useDebouncedCallback((value: string) => {
    pushParams({ search: value || undefined })
  }, 400)

  function handlePageChange(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(p))
    startTransition(() => router.push(`?${params.toString()}`))
  }

  function clearFilters() {
    setSearchValue("")
    startTransition(() => router.push("?"))
  }

  const columns: ColumnDef<InventoryLogWithDetails>[] = [
    {
      id: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {formatTimestamp(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => {
        const a = row.original.action
        const isDestructive = a === "voided"
        return (
          <Badge
            variant={isDestructive ? "destructive" : "outline"}
            className={ACTION_BADGE_CLASS[a]}
          >
            {ACTION_LABELS[a] ?? a}
          </Badge>
        )
      },
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const et = row.original.entity_type
        return (
          <Badge variant={et === "warehouse" ? "outline" : "secondary"}>
            {et === "warehouse" ? "Warehouse" : "Pharmacy"}
          </Badge>
        )
      },
    },
    {
      id: "qty_change",
      header: "Qty Change",
      cell: ({ row }) => {
        const { quantity_change, quantity_before, quantity_after } = row.original
        const isPositive = quantity_change > 0
        const isNegative = quantity_change < 0
        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={`font-medium text-sm ${
                isPositive
                  ? "text-green-600"
                  : isNegative
                    ? "text-destructive"
                    : "text-muted-foreground"
              }`}
            >
              {isPositive ? `+${quantity_change}` : quantity_change}
            </span>
            <span className="text-xs text-muted-foreground">
              {quantity_before} → {quantity_after}
            </span>
          </div>
        )
      },
    },
    {
      id: "reference",
      header: "Reference",
      cell: ({ row }) => {
        const { reference_type, reference_id } = row.original
        if (!reference_type || !reference_id) {
          return <span className="text-muted-foreground">—</span>
        }
        const label = REFERENCE_TYPE_LABELS[reference_type] ?? reference_type.toUpperCase()
        const short = reference_id.slice(-8)
        return (
          <span className="text-xs font-mono text-muted-foreground">
            {label} ···{short}
          </span>
        )
      },
    },
    {
      id: "performed_by",
      header: "Performed By",
      cell: ({ row }) => {
        const user = row.original.performed_by_user
        if (!user) return <span className="text-muted-foreground text-sm">—</span>
        const roleLabel = ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">{user.name}</span>
            <Badge variant="outline" className="text-xs w-fit px-1.5 py-0">
              {roleLabel}
            </Badge>
          </div>
        )
      },
    },
    {
      id: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.original.notes
        if (!notes) return <span className="text-sm text-muted-foreground">—</span>
        const truncated = notes.length > 40 ? notes.slice(0, 40) + "…" : notes
        return <span className="text-sm text-muted-foreground">{truncated}</span>
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Search */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-[280px]">
          <Label className="text-xs text-muted-foreground">Search by user</Label>
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="User name…"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value)
                handleSearch(e.target.value)
              }}
            />
          </div>
        </div>

        {/* Entity type */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Location</Label>
          <Select
            value={entity_type ?? ""}
            onValueChange={(v) =>
              v !== null && pushParams({ entity_type: v || undefined })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue>
                {entity_type === "warehouse"
                  ? "Warehouse"
                  : entity_type === "pharmacy"
                    ? "Pharmacy"
                    : "All Locations"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              <SelectItem value="warehouse">Warehouse</SelectItem>
              <SelectItem value="pharmacy">Pharmacy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Action</Label>
          <Select
            value={action ?? ""}
            onValueChange={(v) =>
              v !== null && pushParams({ action: v || undefined })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue>
                {action ? ACTION_LABELS[action] : "All Actions"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              {(Object.keys(ACTION_LABELS) as InventoryLogAction[]).map((a) => (
                <SelectItem key={a} value={a}>
                  {ACTION_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            className="w-[160px]"
            value={date_from ?? ""}
            onChange={(e) => pushParams({ date_from: e.target.value || undefined })}
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            className="w-[160px]"
            value={date_to ?? ""}
            onChange={(e) => pushParams({ date_to: e.target.value || undefined })}
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs opacity-0">Clear</Label>
            <Button variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div
        className={`rounded-md border transition-opacity ${
          isPending ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-16">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ScrollTextIcon className="h-10 w-10 opacity-30" />
                    <div className="text-center">
                      <p className="font-medium">No logs found</p>
                      <p className="text-sm mt-1">
                        Stock movements will appear here once inventory operations are
                        performed.
                      </p>
                      {hasFilters && (
                        <p className="text-sm mt-0.5">Try adjusting your filters.</p>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        count={count}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
