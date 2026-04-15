"use client";

import { useState, useMemo, useTransition } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Inventory } from "@/types/inventory";
import { getStockStatus, stockStatusConfig } from "@/lib/inventory-utils";
import { getInventory } from "@/app/admin/inventory/actions";
import { AddInventoryModal } from "./AddInventoryModal";
import { EditInventoryModal } from "./EditInventoryModal";
import { DeactivateInventoryDialog } from "./DeactivateInventoryDialog";

function formatPrice(value: number) {
  return `₱${value.toFixed(2)}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StockBadge({
  quantity,
  threshold,
  expiryDate,
}: {
  quantity: number;
  threshold: number;
  expiryDate: string | null;
}) {
  const status = getStockStatus(quantity, threshold, expiryDate);
  const config = stockStatusConfig[status];
  return (
    <Badge
      variant={
        config.variant as "default" | "secondary" | "destructive" | "outline"
      }
      className={config.className}
    >
      {config.label}
    </Badge>
  );
}

function ExpiryCell({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return <span className="text-muted-foreground">—</span>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntil < 0) {
    return (
      <span className="font-medium text-red-600">{formatDate(expiryDate)}</span>
    );
  }
  if (daysUntil <= 60) {
    return (
      <span className="font-medium text-orange-600">
        {formatDate(expiryDate)}
      </span>
    );
  }
  return <span>{formatDate(expiryDate)}</span>;
}

type InventoryTableProps = {
  inventory: Inventory[];
  pharmacies: { id: string; name: string }[];
};

export function InventoryTable({ inventory, pharmacies }: InventoryTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Inventory | null>(null);
  const [filteredInventory, setFilteredInventory] = useState(inventory);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>("All");
  const [, startTransition] = useTransition();

  const handlePharmacyChange = (pharmacyId: string | null) => {
    if (!pharmacyId) return;
    setSelectedPharmacy(pharmacyId);
    startTransition(async () => {
      try {
        const data = await getInventory(
          pharmacyId === "All" ? undefined : pharmacyId,
        );
        setFilteredInventory(data);
      } catch {
        // keep existing data on error
      }
    });
  };

  const columns = useMemo<ColumnDef<Inventory>[]>(
    () => [
      {
        id: "product_name",
        header: "Product Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.products?.name}</span>
        ),
      },
      {
        id: "generic_name",
        header: "Generic Name",
        cell: ({ row }) =>
          row.original.products?.generic_name ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => {
          const name = row.original.products?.product_categories?.name;
          return name ?? <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "pharmacy",
        header: "Pharmacy",
        cell: ({ row }) =>
          row.original.pharmacies?.name ?? (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.getValue("quantity")}</span>
        ),
      },
      {
        id: "stock_status",
        header: "Stock Status",
        cell: ({ row }) => (
          <StockBadge
            quantity={row.original.quantity}
            threshold={row.original.low_stock_threshold}
            expiryDate={row.original.expiry_date}
          />
        ),
      },
      {
        accessorKey: "selling_price",
        header: "Selling Price",
        cell: ({ row }) => formatPrice(row.getValue("selling_price")),
      },
      {
        id: "expiry_date",
        header: "Expiry Date",
        cell: ({ row }) => <ExpiryCell expiryDate={row.original.expiry_date} />,
      },
      {
        id: "last_restocked",
        header: "Last Restocked",
        cell: ({ row }) => (
          <span className="text-sm">
            {formatDate(row.original.last_restocked_at)}
          </span>
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
                  setSelectedEntry(row.original);
                  setEditOpen(true);
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setSelectedEntry(row.original);
                  setDeactivateOpen(true);
                }}
              >
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredInventory,
    columns,
    state: {
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const filter = String(filterValue).toLowerCase();
      const name = String(row.original.products?.name ?? "").toLowerCase();
      const genericName = String(
        row.original.products?.generic_name ?? "",
      ).toLowerCase();
      return name.includes(filter) || genericName.includes(filter);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 8 },
    },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search by product name…"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2">
          {/* Pharmacy filter */}
          <Select value={selectedPharmacy} onValueChange={handlePharmacyChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Pharmacies">
                {selectedPharmacy === "All"
                  ? "All Pharmacies"
                  : pharmacies.find(p => p.id === selectedPharmacy)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Pharmacies</SelectItem>
              {pharmacies.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
            Add Stock Entry
          </Button>
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filteredCount}{" "}
        {filteredCount === 1 ? "inventory entry" : "inventory entries"} found
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
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
                  No inventory entries found.
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

      <AddInventoryModal
        open={addOpen}
        onOpenChange={setAddOpen}
        pharmacies={pharmacies}
      />
      <EditInventoryModal
        open={editOpen}
        onOpenChange={setEditOpen}
        entry={selectedEntry}
      />
      <DeactivateInventoryDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        entryId={selectedEntry?.id ?? null}
        productName={selectedEntry?.products?.name ?? ""}
      />
    </div>
  );
}
