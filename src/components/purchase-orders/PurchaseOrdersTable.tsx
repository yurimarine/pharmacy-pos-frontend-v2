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
  type PurchaseOrderWithItems,
  type PurchaseOrderStatus,
  PO_STATUS_LABELS,
} from "@/types/purchase-order"
import type { UserRole } from "@/types/user"
import { submitPurchaseOrder, cancelPurchaseOrder } from "@/app/admin/purchase-orders/actions"

const AddPurchaseOrderModal = dynamic(
  () => import("./AddPurchaseOrderModal"),
  { ssr: false },
)
const EditPurchaseOrderModal = dynamic(
  () => import("./EditPurchaseOrderModal"),
  { ssr: false },
)
const ViewPurchaseOrderModal = dynamic(
  () => import("./ViewPurchaseOrderModal"),
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

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  if (status === "draft") return <Badge variant="outline">Draft</Badge>
  if (status === "submitted") return <Badge variant="secondary">Submitted</Badge>
  if (status === "partially_received")
    return (
      <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700">
        Partially Received
      </Badge>
    )
  if (status === "received")
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        Received
      </Badge>
    )
  return <Badge variant="destructive">Cancelled</Badge>
}

type Supplier = { id: string; name: string }

type Props = {
  data: PurchaseOrderWithItems[]
  count: number
  page: number
  pageSize: number
  search?: string
  status?: PurchaseOrderStatus | ""
  supplier_id?: string
  suppliers: Supplier[]
  userRole: UserRole
}

export function PurchaseOrdersTable({
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
  const canEdit = userRole === "admin" || userRole === "pharmacist"
  const canCancel = userRole === "admin"

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(search)

  const [addOpen, setAddOpen] = useState(false)
  const [addModalKey, setAddModalKey] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [editModalKey, setEditModalKey] = useState(0)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderWithItems | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewModalKey, setViewModalKey] = useState(0)
  const [viewTarget, setViewTarget] = useState<PurchaseOrderWithItems | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<PurchaseOrderWithItems | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

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

  const openEdit = useCallback((po: PurchaseOrderWithItems) => {
    setSelectedPO(po)
    setEditModalKey(k => k + 1)
    setEditOpen(true)
  }, [])

  const openView = useCallback((po: PurchaseOrderWithItems) => {
    setViewTarget(po)
    setViewModalKey(k => k + 1)
    setViewOpen(true)
  }, [])

  const openCancel = useCallback((po: PurchaseOrderWithItems) => {
    setCancelTarget(po)
    setCancelOpen(true)
  }, [])

  const handleSubmit = useCallback(async (po: PurchaseOrderWithItems) => {
    const result = await submitPurchaseOrder(po.id)
    if (result.success) {
      toast.success(`${po.po_number} submitted.`)
    } else {
      toast.error(result.error ?? "Failed to submit purchase order")
    }
  }, [])

  const handleCancel = async () => {
    if (!cancelTarget) return
    setIsCancelling(true)
    const result = await cancelPurchaseOrder(cancelTarget.id)
    setIsCancelling(false)
    if (result.success) {
      toast.success(`${cancelTarget.po_number} has been cancelled.`)
      setCancelOpen(false)
      setCancelTarget(null)
    } else {
      toast.error(result.error ?? "Failed to cancel purchase order")
    }
  }

  const columns = useMemo<ColumnDef<PurchaseOrderWithItems>[]>(
    () => [
      {
        id: "po_number",
        header: "PO Number",
        cell: ({ row }) => (
          <span className="text-sm font-mono">{row.original.po_number}</span>
        ),
      },
      {
        id: "supplier",
        header: "Supplier",
        cell: ({ row }) =>
          row.original.supplier ? (
            <span className="text-sm">{row.original.supplier.name}</span>
          ) : (
            <span className="text-muted-foreground text-sm">No Supplier</span>
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
        id: "expected_delivery",
        header: "Expected Delivery",
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.expected_delivery_date)}</span>
        ),
      },
      {
        id: "created_by",
        header: "Created By",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.created_by_user?.name ?? "—"}</span>
        ),
      },
      {
        id: "created_at",
        header: "Created At",
        cell: ({ row }) => (
          <span className="text-sm">{formatDate(row.original.created_at)}</span>
        ),
      },
      ...(canEdit || canCancel
        ? [
            {
              id: "actions",
              header: "",
              enableHiding: false,
              cell: ({ row }: { row: { original: PurchaseOrderWithItems } }) => {
                const po = row.original
                const isDraft = po.status === "draft"
                const canSubmitOrEdit = canEdit && isDraft
                const canCancelRow =
                  canCancel &&
                  (po.status === "draft" || po.status === "submitted")

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
                        <DropdownMenuItem onClick={() => openView(po)}>
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      {canSubmitOrEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => openEdit(po)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSubmit(po)}>
                              Submit
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </>
                      )}
                      {canCancelRow && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => openCancel(po)}
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
            } satisfies ColumnDef<PurchaseOrderWithItems>,
          ]
        : []),
    ],
    [canEdit, canCancel, openEdit, openView, openCancel, handleSubmit],
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
            placeholder="Search PO number…"
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
            <SelectTrigger className="w-44">
              <SelectValue>
                {status ? PO_STATUS_LABELS[status as PurchaseOrderStatus] : "All Statuses"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {(Object.entries(PO_STATUS_LABELS) as [PurchaseOrderStatus, string][]).map(
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
        {canEdit && (
          <Button
            size="sm"
            onClick={() => {
              setAddModalKey(k => k + 1)
              setAddOpen(true)
            }}
          >
            <PlusIcon />
            New Purchase Order
          </Button>
        )}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {count === 0
          ? "No purchase orders found"
          : `Showing ${fromItem}–${toItem} of ${count} purchase orders`}
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
                  No purchase orders found.
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
      <AddPurchaseOrderModal
        key={`add-${addModalKey}`}
        open={addOpen}
        onOpenChange={setAddOpen}
        suppliers={suppliers}
      />
      <EditPurchaseOrderModal
        key={`edit-${editModalKey}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        po={selectedPO}
        suppliers={suppliers}
      />
      <ViewPurchaseOrderModal
        key={`view-${viewModalKey}`}
        open={viewOpen}
        onOpenChange={setViewOpen}
        po={viewTarget}
      />

      {/* Cancel AlertDialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel{" "}
              <span className="font-medium text-foreground">
                {cancelTarget?.po_number}
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
              {isCancelling ? "Cancelling…" : "Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
