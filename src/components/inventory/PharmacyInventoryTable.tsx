"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { SearchIcon, MoreHorizontalIcon } from "lucide-react";
import { getStockStatus, stockStatusConfig } from "@/lib/inventory-utils";
import type {
  PharmacyInventoryWithProduct,
  StockStatus,
} from "@/types/inventory";
import type { UserRole } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BulkEditModal from "./BulkEditModal";
import EditPricingModal from "./EditPricingModal";
import EditThresholdModal from "./EditThresholdModal";
import StockAdjustmentModal from "./StockAdjustmentModal";

const STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: stockStatusConfig.in_stock.label },
  { value: "low_stock", label: stockStatusConfig.low_stock.label },
  { value: "out_of_stock", label: stockStatusConfig.out_of_stock.label },
  { value: "near_expiry", label: stockStatusConfig.near_expiry.label },
  { value: "expired", label: stockStatusConfig.expired.label },
];

const STATUS_LABEL_MAP: Record<StockStatus, string> = {
  in_stock: stockStatusConfig.in_stock.label,
  low_stock: stockStatusConfig.low_stock.label,
  out_of_stock: stockStatusConfig.out_of_stock.label,
  near_expiry: stockStatusConfig.near_expiry.label,
  expired: stockStatusConfig.expired.label,
};

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PaginationControls({
  page,
  pageSize,
  count,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  count: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {count === 0
          ? "No results"
          : `Showing ${Math.min((page - 1) * pageSize + 1, count)}–${Math.min(page * pageSize, count)} of ${count}`}
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
        <span className="min-w-16 text-center">
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
  );
}

function rowHighlightClass(status: StockStatus): string {
  if (status === "expired") return "bg-destructive/5";
  if (status === "near_expiry") return "bg-yellow-50 dark:bg-yellow-950/20";
  if (status === "out_of_stock") return "bg-muted/50";
  return "";
}

export default function PharmacyInventoryTable({
  data,
  count,
  page,
  pageSize,
  pharmacy_id,
  search,
  status,
  requires_prescription,
  pharmacies,
  userRole,
}: {
  data: PharmacyInventoryWithProduct[];
  count: number;
  page: number;
  pageSize: number;
  pharmacy_id: string;
  search?: string;
  status?: StockStatus;
  requires_prescription?: boolean;
  pharmacies: { id: string; name: string }[];
  userRole: UserRole;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search ?? "");

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditKey, setBulkEditKey] = useState(0);

  const [editPricingKey, setEditPricingKey] = useState(0);
  const [editThresholdKey, setEditThresholdKey] = useState(0);
  const [adjustStockKey, setAdjustStockKey] = useState(0);
  const [selectedInventory, setSelectedInventory] =
    useState<PharmacyInventoryWithProduct | null>(null);
  const [editPricingOpen, setEditPricingOpen] = useState(false);
  const [editThresholdOpen, setEditThresholdOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);

  const canEdit = userRole === "admin" || userRole === "pharmacist";
  const isAdmin = userRole === "admin";

  function pushParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === undefined || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    }
    params.delete("page");
    startTransition(() => router.push(`?${params.toString()}`));
  }

  const handleSearch = useDebouncedCallback((value: string) => {
    pushParams({ search: value || undefined });
  }, 400);

  function handlePageChange(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    startTransition(() => router.push(`?${params.toString()}`));
  }

  function openEditPricing(inv: PharmacyInventoryWithProduct) {
    setSelectedInventory(inv);
    setEditPricingKey(k => k + 1);
    setEditPricingOpen(true);
  }

  function openEditThreshold(inv: PharmacyInventoryWithProduct) {
    setSelectedInventory(inv);
    setEditThresholdKey(k => k + 1);
    setEditThresholdOpen(true);
  }

  function openAdjustStock(inv: PharmacyInventoryWithProduct) {
    setSelectedInventory(inv);
    setAdjustStockKey(k => k + 1);
    setAdjustStockOpen(true);
  }

  function openBulkEdit() {
    setBulkEditKey(k => k + 1);
    setBulkEditOpen(true);
  }

  const selectedIds = Object.keys(rowSelection).filter(k => rowSelection[k]);

  const columns: ColumnDef<PharmacyInventoryWithProduct>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onCheckedChange={checked => table.toggleAllPageRowsSelected(!!checked)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={checked => row.toggleSelected(!!checked)}
          aria-label="Select row"
        />
      ),
    },
    {
      id: "product",
      header: "Product",
      cell: ({ row }) => {
        const p = row.original.product;
        return (
          <div className="flex flex-col gap-0.5 min-w-40">
            <span className="font-medium text-sm leading-tight">
              {p?.product_name ?? "—"}
            </span>
            {p?.generic_name && (
              <span className="text-xs text-muted-foreground">
                {p.generic_name}
              </span>
            )}
            {p?.sku && (
              <span className="text-xs text-muted-foreground font-mono">
                {p.sku}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "packaging",
      header: "Packaging",
      cell: ({ row }) => {
        const p = row.original.product;
        if (!p) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="text-sm capitalize">
            {p.packaging_type}
            {p.unit_count > 1 ? ` ×${p.unit_count}` : ""}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const inv = row.original;
        const s = getStockStatus(
          inv.quantity,
          inv.low_stock_threshold,
          inv.expiry_date,
        );
        const cfg = stockStatusConfig[s];
        return (
          <Badge
            variant={
              cfg.variant as "default" | "outline" | "destructive" | "secondary"
            }
            className={cfg.className}
          >
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      id: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const inv = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">{inv.quantity} units</span>
            <span className="text-xs text-muted-foreground">
              Threshold: {inv.low_stock_threshold}
            </span>
          </div>
        );
      },
    },
    {
      id: "expiry",
      header: "Expiry",
      cell: ({ row }) => {
        const d = row.original.expiry_date;
        return <span className="text-sm">{formatDate(d)}</span>;
      },
    },
    {
      id: "selling_price",
      header: "Selling Price",
      cell: ({ row }) => {
        const inv = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">
              {formatCurrency(inv.selling_price)}
            </span>
            <span className="text-xs text-muted-foreground">
              {inv.markup_percentage.toFixed(1)}% markup
            </span>
          </div>
        );
      },
    },
    {
      id: "unit_cost",
      header: "Unit Cost",
      cell: ({ row }) => {
        const cost = row.original.product?.unit_cost ?? 0;
        return <span className="text-sm">{formatCurrency(cost)}</span>;
      },
    },
    {
      id: "rx",
      header: "Rx",
      cell: ({ row }) => {
        const req = row.original.product?.requires_prescription;
        return req ? (
          <Badge variant="outline" className="text-xs">
            Rx
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">OTC</span>
        );
      },
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
    ...(canEdit
      ? [
          {
            id: "actions",
            header: "",
            cell: ({
              row,
            }: {
              row: { original: PharmacyInventoryWithProduct };
            }) => (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => openEditPricing(row.original)}
                    >
                      Edit Pricing
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openEditThreshold(row.original)}
                    >
                      Edit Threshold
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => openAdjustStock(row.original)}
                    >
                      Adjust Stock
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          } satisfies ColumnDef<PharmacyInventoryWithProduct>,
        ]
      : []),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.id,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
    enableRowSelection: true,
  });

  const currentStatusLabel = status ? STATUS_LABEL_MAP[status] : undefined;
  const currentRxLabel =
    requires_prescription === true
      ? "Rx Only"
      : requires_prescription === false
        ? "OTC Only"
        : undefined;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Pharmacy selector — admin only */}
        {isAdmin && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Pharmacy</Label>
            <Select
              value={pharmacy_id}
              onValueChange={v => {
                if (v !== null) {
                  const params = new URLSearchParams();
                  params.set("pharmacy_id", v);
                  startTransition(() => router.push(`?${params.toString()}`));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {pharmacies.find(p => p.id === pharmacy_id)?.name ??
                    "Select pharmacy"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className={"w-full"}>
                {pharmacies.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-50 max-w-[320px]">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Name, generic, or SKU…"
              value={searchValue}
              onChange={e => {
                setSearchValue(e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select
            value={status ?? ""}
            onValueChange={v =>
              v !== null && pushParams({ status: v || undefined })
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue>{currentStatusLabel ?? "All statuses"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prescription filter */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Type</Label>
          <Select
            value={
              requires_prescription === true
                ? "true"
                : requires_prescription === false
                  ? "false"
                  : ""
            }
            onValueChange={v =>
              v !== null &&
              pushParams({ requires_prescription: v || undefined })
            }
          >
            <SelectTrigger className="w-35">
              <SelectValue>{currentRxLabel ?? "All types"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="true">Rx Only</SelectItem>
              <SelectItem value="false">OTC Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-md border bg-muted/40">
          <span className="text-sm font-medium">
            {selectedIds.length} item{selectedIds.length !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRowSelection({})}
          >
            Clear
          </Button>
          <Button size="sm" onClick={openBulkEdit}>
            Bulk Edit
          </Button>
        </div>
      )}

      {/* Table */}
      <div
        className={`rounded-md border transition-opacity ${isPending ? "opacity-60 pointer-events-none" : ""}`}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-10 text-muted-foreground"
                >
                  No inventory records found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => {
                const inv = row.original;
                const s = getStockStatus(
                  inv.quantity,
                  inv.low_stock_threshold,
                  inv.expiry_date,
                );
                return (
                  <TableRow key={row.id} className={rowHighlightClass(s)}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
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

      {/* Modals */}
      <BulkEditModal
        key={`be-${bulkEditKey}`}
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedIds={selectedIds}
        onSuccess={() => setRowSelection({})}
      />
      <EditPricingModal
        key={`ep-${editPricingKey}`}
        open={editPricingOpen}
        onOpenChange={setEditPricingOpen}
        inventory={selectedInventory}
      />
      <EditThresholdModal
        key={`et-${editThresholdKey}`}
        open={editThresholdOpen}
        onOpenChange={setEditThresholdOpen}
        inventory={selectedInventory}
      />
      <StockAdjustmentModal
        key={`sa-${adjustStockKey}`}
        open={adjustStockOpen}
        onOpenChange={setAdjustStockOpen}
        inventory={selectedInventory}
        pharmacyId={pharmacy_id}
      />
    </div>
  );
}
