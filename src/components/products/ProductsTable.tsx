"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  EllipsisVerticalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SlidersHorizontalIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product, ProductType, ProductStatus } from "@/types/product";
import { AddProductModal } from "./AddProductModal";
import { EditProductModal } from "./EditProductModal";
import { DiscontinueProductDialog } from "./DiscontinueProductDialog";

function formatPrice(value: number) {
  return `₱${value.toFixed(2)}`;
}

function TypeBadge({ type }: { type: ProductType }) {
  if (type === "branded") return <Badge variant="default">Branded</Badge>;
  if (type === "generic") return <Badge variant="secondary">Generic</Badge>;
  return <Badge variant="outline">N/A</Badge>;
}

function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === "active") return <Badge variant="default">Active</Badge>;
  if (status === "inactive")
    return (
      <Badge
        variant="outline"
        className="border-yellow-500 text-yellow-600 bg-yellow-50"
      >
        Inactive
      </Badge>
    );
  return <Badge variant="destructive">Discontinued</Badge>;
}

type ProductsTableProps = {
  products: Product[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  currentSearch: string;
};

export function ProductsTable({
  products,
  totalCount,
  currentPage,
  pageSize,
  currentSearch,
}: ProductsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(currentSearch);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    sku: false,
    barcode: false,
    class: false,
    category: false,
    packaging: false,
    supplier: false,
    manufacturer: false,
    requires_prescription: false,
  });
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [discontinueOpen, setDiscontinueOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      if (updates.search !== undefined) {
        params.set("page", "1");
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router],
  );

  const handleSearch = useDebouncedCallback((value: string) => {
    updateParams({ search: value || null });
  }, 400);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => {
          const sku = row.getValue("sku") as string | null;
          return sku ? (
            <span className="font-mono text-sm">{sku}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "barcode",
        header: "Barcode",
        cell: ({ row }) => {
          const barcode = row.getValue("barcode") as string | null;
          return barcode ? (
            <span className="font-mono text-sm">{barcode}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
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
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("generic_name")}</span>
        ),
      },
      {
        id: "class",
        header: "Class",
        cell: ({ row }) => {
          const name = row.original.product_classes?.name;
          return name ? (
            <Badge variant="outline">{name}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) =>
          row.original.product_categories?.name ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <TypeBadge type={row.getValue("type") as ProductType} />
        ),
      },
      {
        accessorKey: "base_price",
        header: "Base Price",
        cell: ({ row }) => formatPrice(row.getValue("base_price")),
      },
      {
        id: "packaging",
        header: "Packaging",
        cell: ({ row }) => {
          const pkg = row.original.packaging_units;
          if (!pkg) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="font-mono text-sm">
              {row.original.unit_count} {pkg.abbreviation}
            </span>
          );
        },
      },
      {
        id: "supplier",
        header: "Supplier",
        cell: ({ row }) =>
          row.original.suppliers?.name ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "manufacturer",
        header: "Manufacturer",
        cell: ({ row }) =>
          row.original.manufacturers?.name ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "requires_prescription",
        header: "Prescription",
        cell: ({ row }) => {
          const req = row.getValue("requires_prescription") as boolean;
          return (
            <Badge variant={req ? "destructive" : "secondary"}>
              {req ? "Yes" : "No"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.getValue("status") as ProductStatus} />
        ),
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
                  setSelected(row.original);
                  setEditOpen(true);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setSelected(row.original);
                  setDiscontinueOpen(true);
                }}
              >
                Discontinue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: products,
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      columnVisibility: {
        sku: false,
        barcode: false,
        class: false,
        category: false,
        packaging: false,
        supplier: false,
        manufacturer: false,
        requires_prescription: false,
      },
    },
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search by name…"
          value={searchValue}
          onChange={e => {
            setSearchValue(e.target.value);
            handleSearch(e.target.value);
          }}
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
                .filter(col => col.getCanHide())
                .map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={value => col.toggleVisibility(!!value)}
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
        {totalCount} {totalCount === 1 ? "product" : "products"} found
      </p>

      {/* Table — dims while loading */}
      <div
        className={`overflow-x-auto rounded-md border transition-opacity ${
          isPending ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
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
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1 || isPending}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams({ page: String(currentPage + 1) })}
              disabled={currentPage >= totalPages || isPending}
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
        product={selected}
      />
      <DiscontinueProductDialog
        open={discontinueOpen}
        onOpenChange={setDiscontinueOpen}
        productId={selected?.id ?? null}
        productName={selected?.name ?? ""}
      />
    </div>
  );
}
