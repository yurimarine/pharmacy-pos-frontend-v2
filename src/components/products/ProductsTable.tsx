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
  type Product,
  type ProductType,
  type ProductStatus,
  PRODUCT_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
} from "@/types/product"
import { deleteProduct, updateProductStatus } from "@/app/admin/products/actions"
import type { UserRole } from "@/types/user"

const AddProductModal = dynamic(() => import("./AddProductModal"), { ssr: false })
const EditProductModal = dynamic(() => import("./EditProductModal"), { ssr: false })

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

type Props = {
  data: Product[]
  count: number
  page: number
  pageSize: number
  search?: string
  type?: ProductType | ""
  status?: ProductStatus | ""
  category?: string
  requires_prescription?: boolean
  userRole: UserRole
}

export function ProductsTable({
  data,
  count,
  page,
  pageSize,
  search = "",
  type = "",
  status = "",
  category = "",
  requires_prescription,
  userRole,
}: Props) {
  const canEdit = userRole === "admin" || userRole === "pharmacist"
  const canDelete = userRole === "admin"

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(search)

  // modal state
  const [addOpen, setAddOpen] = useState(false)
  const [addModalKey, setAddModalKey] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [editModalKey, setEditModalKey] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // discontinue dialog state
  const [discontinueOpen, setDiscontinueOpen] = useState(false)
  const [discontinueTarget, setDiscontinueTarget] = useState<Product | null>(null)
  const [isDiscontinuing, setIsDiscontinuing] = useState(false)

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
      if (isFilterChange) {
        params.set("page", "1")
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

  const handleTypeChange = (value: string | null) => {
    if (value === null) return
    updateParams({ type: value || null })
  }

  const handleStatusChange = (value: string | null) => {
    if (value === null) return
    updateParams({ status: value || null })
  }

  const handlePrescriptionChange = (value: string | null) => {
    if (value === null) return
    updateParams({ requires_prescription: value || null })
  }

  const handleStatusToggle = useCallback(async (product: Product) => {
    const newStatus: ProductStatus = product.status === "active" ? "inactive" : "active"
    const result = await updateProductStatus(product.id, newStatus)
    if (result.success) {
      toast.success(`${product.product_name} marked as ${newStatus}.`)
    } else {
      toast.error(result.error ?? "Failed to update status")
    }
  }, [])

  const openEdit = useCallback((product: Product) => {
    setSelectedProduct(product)
    setEditModalKey(k => k + 1)
    setEditOpen(true)
  }, [])

  const openDiscontinue = useCallback((product: Product) => {
    setDiscontinueTarget(product)
    setDiscontinueOpen(true)
  }, [])

  const handleDiscontinue = async () => {
    if (!discontinueTarget) return
    setIsDiscontinuing(true)
    const result = await deleteProduct(discontinueTarget.id)
    setIsDiscontinuing(false)
    if (result.success) {
      toast.success(`${discontinueTarget.product_name} has been discontinued.`)
      setDiscontinueOpen(false)
      setDiscontinueTarget(null)
    } else {
      toast.error(result.error ?? "Failed to discontinue product")
    }
  }

  const prescriptionValue =
    requires_prescription === true
      ? "true"
      : requires_prescription === false
        ? "false"
        : ""

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "product_name",
        header: "Product Name",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium leading-snug">
              {row.original.product_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.generic_name}
            </span>
          </div>
        ),
      },
      {
        id: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.sku}
          </span>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) =>
          row.original.category ? (
            <span className="text-sm">{row.original.category}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const t = row.original.type
          if (t === "branded") return <Badge variant="default">Branded</Badge>
          if (t === "generic") return <Badge variant="secondary">Generic</Badge>
          return <Badge variant="outline">OTC</Badge>
        },
      },
      {
        id: "packaging",
        header: "Packaging",
        cell: ({ row }) => {
          const { packaging_type, unit_count } = row.original
          return (
            <span className="text-sm">
              {unit_count > 1 ? `${packaging_type} × ${unit_count}` : packaging_type}
            </span>
          )
        },
      },
      {
        id: "unit_cost",
        header: "Unit Cost",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatCurrency(row.original.unit_cost)}
          </span>
        ),
      },
      {
        id: "requires_prescription",
        header: "Rx",
        cell: ({ row }) =>
          row.original.requires_prescription ? (
            <Badge variant="destructive">Rx Required</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status
          if (s === "active")
            return (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                Active
              </Badge>
            )
          if (s === "inactive") return <Badge variant="secondary">Inactive</Badge>
          return (
            <Badge
              variant="outline"
              className="border-destructive text-destructive"
            >
              Discontinued
            </Badge>
          )
        },
      },
      ...(canEdit || canDelete
        ? [
            {
              id: "actions",
              header: "",
              enableHiding: false,
              cell: ({ row }: { row: { original: Product } }) => {
                const product = row.original
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
                      {canEdit && (
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => openEdit(product)}>
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      )}
                      {canEdit && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => handleStatusToggle(product)}
                            >
                              {product.status === "active"
                                ? "Mark Inactive"
                                : "Mark Active"}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </>
                      )}
                      {canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => openDiscontinue(product)}
                            >
                              Discontinue
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              },
            } satisfies ColumnDef<Product>,
          ]
        : []),
    ],
    [canEdit, canDelete, openEdit, openDiscontinue, handleStatusToggle],
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
            placeholder="Search products…"
            value={searchValue}
            onChange={e => {
              setSearchValue(e.target.value)
              handleSearch(e.target.value)
            }}
            className="w-60"
          />
          <Select value={type} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-36">
              <SelectValue>
                {type ? PRODUCT_TYPE_LABELS[type as ProductType] : "All Types"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {(Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][]).map(
                ([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue>
                {status
                  ? PRODUCT_STATUS_LABELS[status as ProductStatus]
                  : "All Statuses"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              {(Object.entries(PRODUCT_STATUS_LABELS) as [ProductStatus, string][]).map(
                ([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Select value={prescriptionValue} onValueChange={handlePrescriptionChange}>
            <SelectTrigger className="w-44">
              <SelectValue>
                {requires_prescription === true
                  ? "Prescription Only"
                  : requires_prescription === false
                    ? "No Prescription"
                    : "All"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="true">Prescription Only</SelectItem>
              <SelectItem value="false">No Prescription</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setAddModalKey(k => k + 1)
            setAddOpen(true)
          }}
        >
          <PlusIcon />
          Add Product
        </Button>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {count === 0
          ? "No products found"
          : `Showing ${fromItem}–${toItem} of ${count} products`}
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
                  No products found.
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
      <AddProductModal key={`add-${addModalKey}`} open={addOpen} onOpenChange={setAddOpen} />
      <EditProductModal
        key={`edit-${editModalKey}`}
        open={editOpen}
        onOpenChange={setEditOpen}
        product={selectedProduct}
      />

      {/* Discontinue AlertDialog */}
      <AlertDialog open={discontinueOpen} onOpenChange={setDiscontinueOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Discontinue Product</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark{" "}
              <span className="font-medium text-foreground">
                {discontinueTarget?.product_name}
              </span>{" "}
              as discontinued. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDiscontinuing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDiscontinue}
              disabled={isDiscontinuing}
            >
              {isDiscontinuing ? "Discontinuing…" : "Discontinue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
