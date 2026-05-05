"use client"

import dynamic from "next/dynamic"
import { useState, useMemo, useTransition, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react"
import { toast } from "sonner"
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
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  type WarehouseReceiptWithItems,
  type WarehouseReceiptStatus,
  WR_STATUS_LABELS,
} from "@/types/inventory"
import type { UserRole } from "@/types/user"
import {
  completeWarehouseReceipt,
  cancelWarehouseReceipt,
} from "@/app/admin/warehouse-receipts/actions"

const AddWarehouseReceiptModal = dynamic(
  () => import("./AddWarehouseReceiptModal"),
  { ssr: false },
)
const EditWarehouseReceiptModal = dynamic(
  () => import("./EditWarehouseReceiptModal"),
  { ssr: false },
)
const ViewWarehouseReceiptModal = dynamic(
  () => import("./ViewWarehouseReceiptModal"),
  { ssr: false },
)

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function StatusBadge({ status }: { status: WarehouseReceiptStatus }) {
  if (status === "draft") return <Badge variant="outline">Draft</Badge>
  if (status === "completed")
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        Completed
      </Badge>
    )
  return <Badge variant="destructive">Cancelled</Badge>
}

type Supplier = { id: string; name: string }

type Props = {
  data: WarehouseReceiptWithItems[]
  count: number
  page: number
  pageSize: number
  search?: string
  status?: WarehouseReceiptStatus | ""
  supplier_id?: string
  suppliers: Supplier[]
  userRole: UserRole
}

export function WarehouseReceiptsTable({
  data,
  count,
  page,
  pageSize,
  search = "",
  status = "",
  supplier_id = "",
  suppliers,
  userRole,
}: Props) {
  const isAdmin = userRole === "admin"

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(search)

  const [addOpen, setAddOpen] = useState(false)
  const [addModalKey, setAddModalKey] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [editModalKey, setEditModalKey] = useState(0)
  const [selectedReceipt, setSelectedReceipt] = useState<WarehouseReceiptWithItems | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewModalKey, setViewModalKey] = useState(0)
  const [viewTarget, setViewTarget] = useState<WarehouseReceiptWithItems | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<WarehouseReceiptWithItems | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [completeTarget, setCompleteTarget] = useState<WarehouseReceiptWithItems | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const isFilterChange = Object.keys(updates).some(k => k !== "page")
      if (isFilterChange) params.set("page", "1")
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [searchParams, pathname, router],
  )

  const handleSearch = useDebouncedCallback(
    (value: string) => updateParams({ search: value || null }),
    400,
  )

  const openEdit = useCallback((r: WarehouseReceiptWithItems) => {
    setSelectedReceipt(r)
    setEditModalKey(k => k + 1)
    setEditOpen(true)
  }, [])

  const openView = useCallback((r: WarehouseReceiptWithItems) => {
    setViewTarget(r)
    setViewModalKey(k => k + 1)
    setViewOpen(true)
  }, [])

  const handleComplete = async () => {
    if (!completeTarget) return
    setIsCompleting(true)
    const result = await completeWarehouseReceipt(completeTarget.id)
    setIsCompleting(false)
    if (result.success) {
      toast.success(`${completeTarget.receipt_number} completed.`)
      setCompleteOpen(false)
      setCompleteTarget(null)
    } else {
      toast.error(result.error ?? "Failed to complete receipt")
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    setIsCancelling(true)
    const result = await cancelWarehouseReceipt(cancelTarget.id)
    setIsCancelling(false)
    if (result.success) {
      toast.success(`${cancelTarget.receipt_number} has been cancelled.`)
      setCancelOpen(false)
      setCancelTarget(null)
    } else {
      toast.error(result.error ?? "Failed to cancel receipt")
    }
  }

  const columns = useMemo<ColumnDef<WarehouseReceiptWithItems>[]>(
    () => [
      {
        id: "receipt_number",
        header: "Receipt #",
        cell: ({ row }) => (
          <span className="text-sm font-mono">{row.original.receipt_number}</span>
        ),
      },
      {
        id: "supplier",
        header: "Supplier",
        cell: ({ row }) =>
          row.original.supplier ? (
            <span className="text-sm">{row.original.supplier.name}</span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
      {
        id: "po",
        header: "PO #",
        cell: ({ row }) =>
          row.original.po ? (
            <span className="text-sm font-mono">{row.original.po.po_number}</span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => {
          const n = row.original.items?.length ?? 0
          return (
            <span className="text-sm text-muted-foreground">
              {n} item{n !== 1 ? "s" : ""}
            </span>
          )
        },
      },
      {
        id: "received_by",
        header: "Received By",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.received_by_user?.name ?? "—"}</span>
        ),
      },
      {
        id: "created_at",
        header: "Created At",
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.created_at)}</span>
        ),
      },
      ...(isAdmin
        ? [
            {
              id: "actions",
              header: "",
              enableHiding: false,
              cell: ({ row }: { row: { original: WarehouseReceiptWithItems } }) => {
                const receipt = row.original
                const isDraft = receipt.status === "draft"

                return (
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
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => openView(receipt)}>
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      {isDraft && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => openEdit(receipt)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setCompleteTarget(receipt)
                                setCompleteOpen(true)
                              }}
                            >
                              Complete Receipt
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => {
                                setCancelTarget(receipt)
                                setCancelOpen(true)
                              }}
                            >
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              },
            } satisfies ColumnDef<WarehouseReceiptWithItems>,
          ]
        : []),
    ],
    [isAdmin, openEdit, openView],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const totalPages = Math.ceil(count / pageSize)
  const fromItem = count === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, count)

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search receipt number…"
            value={searchValue}
            onChange={e => {
              setSearchValue(e.target.value)
              handleSearch(e.target.value)
            }}
            className="w-56"
          />
          <Select
            value={status}
            onValueChange={v => v !== null && updateParams({ status: v || null })}
          >
            <SelectTrigger className="w-40">
              <SelectValue>
                {status ? WR_STATUS_LABELS[status as WarehouseReceiptStatus] : "All Statuses"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {(Object.entries(WR_STATUS_LABELS) as [WarehouseReceiptStatus, string][]).map(
                ([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Select
            value={supplier_id}
            onValueChange={v => v !== null && updateParams({ supplier_id: v || null })}
          >
            <SelectTrigger className="w-44">
              <SelectValue>
                {supplier_id
                  ? (suppliers.find(s => s.id === supplier_id)?.name ?? "All Suppliers")
                  : "All Suppliers"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Suppliers</SelectItem>
              {suppliers.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => {
              setAddModalKey(k => k + 1)
              setAddOpen(true)
            }}
          >
            <PlusIcon />
            New Receipt
          </Button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {count === 0
          ? "No warehouse receipts found"
          : `Showing ${fromItem}–${toItem} of ${count} receipts`}
      </p>

      {/* Table */}
      <div
        className={`overflow-x-auto rounded-md border transition-opacity ${
          isPending ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id} className="whitespace-nowrap">
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
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                  No warehouse receipts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams({ page: String(page - 1) })}
              disabled={page <= 1 || isPending}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams({ page: String(page + 1) })}
              disabled={page >= totalPages || isPending}
            >
              Next
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddWarehouseReceiptModal
        key={`add-${addModalKey}`}
        open={addOpen}
        onOpenChange={setAddOpen}
        suppliers={suppliers}
      />
      <EditWarehouseReceiptModal
        key={`edit-${editModalKey}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        receipt={selectedReceipt}
        suppliers={suppliers}
      />
      <ViewWarehouseReceiptModal
        key={`view-${viewModalKey}`}
        open={viewOpen}
        onOpenChange={setViewOpen}
        receipt={viewTarget}
      />

      {/* Complete AlertDialog */}
      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Warehouse Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              This will complete{" "}
              <span className="font-medium text-foreground">
                {completeTarget?.receipt_number}
              </span>{" "}
              and add all items to warehouse inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompleting}>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? "Completing…" : "Complete Receipt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel AlertDialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Warehouse Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel{" "}
              <span className="font-medium text-foreground">
                {cancelTarget?.receipt_number}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling…" : "Cancel Receipt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
