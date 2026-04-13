"use client"

import { useState, useMemo, useTransition } from "react"
import { format } from "date-fns"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { InventoryLog } from "@/types/inventory-log"
import { getInventoryLogs } from "@/app/admin/inventory-logs/actions"

type InventoryLogsTableProps = {
  logs: InventoryLog[]
  pharmacies: { id: string; name: string }[]
}

export function InventoryLogsTable({ logs, pharmacies }: InventoryLogsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [logList, setLogList] = useState(logs)
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const handlePharmacyChange = (pharmacyId: string | null) => {
    setSelectedPharmacyId(pharmacyId)
    startTransition(async () => {
      try {
        const data = await getInventoryLogs(pharmacyId ?? undefined)
        setLogList(data)
      } catch {
        // keep existing data
      }
    })
  }

  const columns = useMemo<ColumnDef<InventoryLog>[]>(
    () => [
      {
        id: "product",
        header: "Product",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.products?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "pharmacy",
        header: "Pharmacy",
        cell: ({ row }) => row.original.pharmacies?.name ?? "—",
      },
      {
        id: "changed_by",
        header: "Changed By",
        cell: ({ row }) => row.original.users?.name ?? "—",
      },
      {
        accessorKey: "change_type",
        header: "Change Type",
        cell: ({ row }) => {
          const type = row.getValue<string>("change_type")
          return (
            <Badge variant="outline">
              {type === "manual_adjustment" ? "Manual Edit" : type}
            </Badge>
          )
        },
      },
      {
        accessorKey: "previous_quantity",
        header: "Prev Qty",
        cell: ({ row }) => (
          <span className="tabular-nums text-right block">
            {row.getValue("previous_quantity")}
          </span>
        ),
      },
      {
        accessorKey: "new_quantity",
        header: "New Qty",
        cell: ({ row }) => (
          <span className="tabular-nums text-right block">
            {row.getValue("new_quantity")}
          </span>
        ),
      },
      {
        id: "difference",
        header: "Difference",
        cell: ({ row }) => {
          const diff =
            row.original.new_quantity - row.original.previous_quantity
          if (diff === 0)
            return <span className="text-muted-foreground tabular-nums">0</span>
          return (
            <span
              className={`tabular-nums font-medium ${diff > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {diff > 0 ? `+${diff}` : diff}
            </span>
          )
        },
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => {
          const reason = row.getValue<string>("reason") ?? ""
          const truncated =
            reason.length > 40 ? reason.slice(0, 40) + "…" : reason
          return (
            <span title={reason} className="text-muted-foreground">
              {truncated || "—"}
            </span>
          )
        },
      },
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => {
          try {
            return format(
              new Date(row.getValue("created_at")),
              "MMM dd, yyyy hh:mm a"
            )
          } catch {
            return row.getValue("created_at")
          }
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: logList,
    columns,
    state: {
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const product = String(
        row.original.products?.name ?? ""
      ).toLowerCase()
      return product.includes(String(filterValue).toLowerCase())
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1

  const selectedPharmacyName =
    pharmacies.find((p) => p.id === selectedPharmacyId)?.name ?? "All Pharmacies"

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search by product name…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          {/* Pharmacy filter */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              {selectedPharmacyName}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handlePharmacyChange(null)}>
                All Pharmacies
              </DropdownMenuItem>
              {pharmacies.map((pharmacy) => (
                <DropdownMenuItem
                  key={pharmacy.id}
                  onClick={() => handlePharmacyChange(pharmacy.id)}
                >
                  {pharmacy.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <SlidersHorizontalIcon />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {col.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filteredCount} log {filteredCount === 1 ? "entry" : "entries"}
      </p>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No inventory edits have been logged yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
