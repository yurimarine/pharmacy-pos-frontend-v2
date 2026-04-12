"use client"

import { useState, useMemo } from "react"
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
import type { Product } from "@/types/product"
import { AddProductModal } from "./AddProductModal"
import { EditProductModal } from "./EditProductModal"
import { DeactivateProductDialog } from "./DeactivateProductDialog"

function formatPrice(value: number) {
  return `₱${value.toFixed(2)}`
}

export function ProductsTable({ products }: { products: Product[] }) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "generic_name",
        header: "Generic Name",
        cell: ({ row }) => (row.getValue("generic_name") as string) ?? "—",
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (row.getValue("category") as string) ?? "—",
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.getValue("type") as string
          return (
            <Badge variant={type === "branded" ? "default" : "secondary"}>
              {type === "branded" ? "Branded" : "Generic"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "base_price",
        header: "Base Price",
        cell: ({ row }) => formatPrice(row.getValue("base_price")),
      },
      {
        id: "supplier",
        header: "Supplier",
        cell: ({ row }) => row.original.suppliers?.name ?? "—",
      },
      {
        id: "manufacturer",
        header: "Manufacturer",
        cell: ({ row }) => row.original.manufacturers?.name ?? "—",
      },
      {
        accessorKey: "requires_prescription",
        header: "Prescription",
        cell: ({ row }) => {
          const req = row.getValue("requires_prescription") as boolean
          return (
            <Badge variant={req ? "destructive" : "secondary"}>
              {req ? "Yes" : "No"}
            </Badge>
          )
        },
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
                onClick={() => {
                  setSelectedProduct(row.original)
                  setEditOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setSelectedProduct(row.original)
                  setDeactivateOpen(true)
                }}
              >
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: products,
    columns,
    state: {
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const name = String(row.getValue("name") ?? "").toLowerCase()
      return name.includes(String(filterValue).toLowerCase())
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 8 },
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
          placeholder="Search by name…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
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
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon />
            Add Product
          </Button>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filteredCount} {filteredCount === 1 ? "product" : "products"} found
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
                  No products found.
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

      <AddProductModal open={addOpen} onOpenChange={setAddOpen} />
      <EditProductModal
        open={editOpen}
        onOpenChange={setEditOpen}
        product={selectedProduct}
      />
      <DeactivateProductDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        productId={selectedProduct?.id ?? null}
        productName={selectedProduct?.name ?? ""}
      />
    </div>
  )
}
