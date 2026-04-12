"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
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
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SlidersHorizontalIcon,
  PlusIcon,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Batch } from "@/types/batch"
import { getBatches } from "@/app/admin/batches/actions"
import { CreateBatchModal } from "./CreateBatchModal"
import { CancelBatchDialog } from "./CancelBatchDialog"

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function TypeBadge({ type }: { type: string }) {
  if (type === "stock_in") {
    return <Badge variant="default">Stock In</Badge>
  }
  return (
    <Badge className="border-transparent bg-orange-100 text-orange-800 hover:bg-orange-100">
      Stock Out
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <Badge className="border-transparent bg-green-100 text-green-800 hover:bg-green-100">
        Completed
      </Badge>
    )
  }
  if (status === "cancelled") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Cancelled
      </Badge>
    )
  }
  return <Badge variant="outline">Draft</Badge>
}

type BatchesTableProps = {
  batches: Batch[]
  pharmacies: { id: string; name: string }[]
}

export function BatchesTable({ batches, pharmacies }: BatchesTableProps) {
  const router = useRouter()
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [createOpen, setCreateOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [showCancelled, setShowCancelled] = useState(false)
  const [batchList, setBatchList] = useState(batches)
  const [, startTransition] = useTransition()

  const handleToggleCancelled = () => {
    const next = !showCancelled
    setShowCancelled(next)
    startTransition(async () => {
      try {
        const data = await getBatches(next)
        setBatchList(data)
      } catch {
        // keep existing data
      }
    })
  }

  const columns = useMemo<ColumnDef<Batch>[]>(
    () => [
      {
        accessorKey: "batch_number",
        header: "Batch Number",
        cell: ({ row }) => (
          <span className="font-medium font-mono">
            {row.getValue("batch_number")}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <TypeBadge type={row.getValue("type")} />,
      },
      {
        id: "pharmacy",
        header: "Pharmacy",
        cell: ({ row }) => row.original.pharmacy?.name ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => {
          const count = row.original.batch_items?.[0]?.count ?? 0
          return <span className="tabular-nums">{count}</span>
        },
      },
      {
        id: "created_by",
        header: "Created By",
        cell: ({ row }) => row.original.users?.name ?? "—",
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => formatDateTime(row.getValue("created_at")),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Open actions"
                />
              }
            >
              <EllipsisVerticalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/admin/batches/${row.original.id}`)
                }
              >
                View
              </DropdownMenuItem>
              {row.original.status === "draft" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      setSelectedBatch(row.original)
                      setCancelOpen(true)
                    }}
                  >
                    Cancel
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [router]
  )

  const table = useReactTable({
    data: batchList,
    columns,
    state: {
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const batchNumber = String(
        row.getValue("batch_number") ?? ""
      ).toLowerCase()
      return batchNumber.includes(String(filterValue).toLowerCase())
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

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search by batch number…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleCancelled}
          >
            {showCancelled ? "Hide Cancelled" : "Show Cancelled"}
          </Button>
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
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New Batch
          </Button>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filteredCount} {filteredCount === 1 ? "batch" : "batches"} found
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
                  No batches found.
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

      <CreateBatchModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        pharmacies={pharmacies}
        onCreated={(batch) => router.push(`/admin/batches/${batch.id}`)}
      />
      <CancelBatchDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        batchId={selectedBatch?.id ?? null}
        batchNumber={selectedBatch?.batch_number ?? ""}
        onCancelled={() => {
          setBatchList((prev) =>
            prev.map((b) =>
              b.id === selectedBatch?.id ? { ...b, status: "cancelled" } : b
            )
          )
        }}
      />
    </div>
  )
}
