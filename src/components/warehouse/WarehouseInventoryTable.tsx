"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WarehouseInventoryWithProduct } from "@/types/inventory";
import type { UserRole } from "@/types/user";
import { getStockStatus, stockStatusConfig } from "@/lib/inventory-utils";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No expiry";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(value: number): string {
  return `₱${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ExpiryCell({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) {
    return <span className="text-sm text-muted-foreground">No expiry</span>;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const isExpired = expiry < today;
  const daysUntil = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isNearExpiry = !isExpired && daysUntil <= 60;

  const className = isExpired
    ? "text-sm font-medium text-destructive"
    : isNearExpiry
      ? "text-sm font-medium text-yellow-600"
      : "text-sm";

  return <span className={className}>{formatDate(expiryDate)}</span>;
}

function getRowHighlightClass(row: WarehouseInventoryWithProduct): string {
  if (!row.expiry_date) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(row.expiry_date);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return "bg-destructive/5";
  const daysUntil = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysUntil <= 60) return "bg-yellow-50 dark:bg-yellow-950/20";
  return "";
}

type Props = {
  data: WarehouseInventoryWithProduct[];
  count: number;
  page: number;
  pageSize: number;
  search?: string;
  has_stock?: boolean;
  expiring_within_days?: number;
  receipt_id?: string;
  receipts?: {
    id: string;
    receipt_number: string;
    received_at: string | null;
  }[];
  userRole: UserRole;
};

export function WarehouseInventoryTable({
  data,
  count,
  page,
  pageSize,
  search = "",
  has_stock,
  expiring_within_days,
  receipt_id,
  receipts = [],
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const isFilterChange = Object.keys(updates).some(k => k !== "page");
      if (isFilterChange) params.set("page", "1");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router],
  );

  const handleSearch = useDebouncedCallback(
    (value: string) => updateParams({ search: value || null }),
    400,
  );

  // Derive Select values for controlled display
  const stockFilterValue =
    has_stock === true ? "true" : has_stock === false ? "false" : "";

  const expiryFilterValue =
    expiring_within_days !== undefined ? String(expiring_within_days) : "";

  const columns = useMemo<ColumnDef<WarehouseInventoryWithProduct>[]>(
    () => [
      {
        id: "product",
        header: "Product",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {row.original.product?.product_name ?? "—"}
            </span>
            {row.original.product?.generic_name && (
              <span className="text-xs text-muted-foreground">
                {row.original.product.generic_name}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {row.original.product?.sku ?? "—"}
          </span>
        ),
      },
      {
        id: "lot_number",
        header: "Lot #",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.lot_number ?? "—"}</span>
        ),
      },
      {
        id: "expiry_date",
        header: "Expiry Date",
        cell: ({ row }) => <ExpiryCell expiryDate={row.original.expiry_date} />,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = getStockStatus(
            row.original.quantity_remaining,
            0,
            row.original.expiry_date,
          );
          const config = stockStatusConfig[status];
          return (
            <Badge
              variant={
                config.variant as
                  | "default"
                  | "outline"
                  | "secondary"
                  | "destructive"
              }
              className={config.className}
            >
              {config.label}
            </Badge>
          );
        },
      },
      {
        id: "quantity_remaining",
        header: "Qty Remaining",
        cell: ({ row }) => {
          const qty = row.original.quantity_remaining;
          if (qty === 0) {
            return (
              <span className="text-sm text-muted-foreground">
                0 (depleted)
              </span>
            );
          }
          return (
            <span className="text-sm tabular-nums font-medium">{qty}</span>
          );
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
        id: "receipt",
        header: "Receipt #",
        cell: ({ row }) => (
          <span className="text-xs font-mono font-medium">
            {row.original.receipt_item?.receipt?.receipt_number ?? "—"}
          </span>
        ),
      },
      {
        id: "created_at",
        header: "Received At",
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(count / pageSize);
  const fromItem = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const toItem = Math.min(page * pageSize, count);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Search product, SKU, lot number…"
          value={searchValue}
          onChange={e => {
            setSearchValue(e.target.value);
            handleSearch(e.target.value);
          }}
          className="w-64"
        />
        <Select
          value={stockFilterValue}
          onValueChange={v =>
            v !== null && updateParams({ has_stock: v || null })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue>
              {has_stock === true
                ? "In Stock Only"
                : has_stock === false
                  ? "Out of Stock"
                  : "All Stock"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Stock</SelectItem>
            <SelectItem value="true">In Stock Only</SelectItem>
            <SelectItem value="false">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={expiryFilterValue}
          onValueChange={v =>
            v !== null && updateParams({ expiring_within: v || null })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue>
              {expiring_within_days === -1
                ? "Expired"
                : expiring_within_days === 30
                  ? "Expiring in 30 days"
                  : expiring_within_days === 60
                    ? "Expiring in 60 days"
                    : expiring_within_days === 90
                      ? "Expiring in 90 days"
                      : "All Expiry"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Expiry</SelectItem>
            <SelectItem value="30">Expiring in 30 days</SelectItem>
            <SelectItem value="60">Expiring in 60 days</SelectItem>
            <SelectItem value="90">Expiring in 90 days</SelectItem>
            <SelectItem value="-1">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={receipt_id ?? ""}
          onValueChange={v =>
            v !== null && updateParams({ receipt_id: v || null })
          }
        >
          <SelectTrigger className="w-50">
            <SelectValue>
              {receipt_id
                ? (receipts.find(r => r.id === receipt_id)?.receipt_number ??
                  "Unknown Receipt")
                : "All Receipts"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Receipts</SelectItem>
            {(receipts ?? []).map(r => (
              <SelectItem key={r.id} value={r.id}>
                {r.receipt_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {count === 0
          ? "No batches found"
          : `Showing ${fromItem}–${toItem} of ${count} batches`}
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
                <TableRow
                  key={row.id}
                  className={getRowHighlightClass(row.original)}
                >
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
                  No warehouse batches found.
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
    </div>
  );
}
