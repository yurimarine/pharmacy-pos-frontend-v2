"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { SearchIcon, XCircleIcon } from "lucide-react";
import {
  type TillSessionWithRelations,
  type TillSessionStatus,
  TILL_SESSION_STATUS_LABELS,
} from "@/types/till-session";
import { ROLE_LABELS, type UserRole } from "@/types/user";
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

type Props = {
  data: TillSessionWithRelations[];
  count: number;
  pharmacies: { id: string; name: string }[];
  currentPharmacyId?: string;
  currentRole?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
  currentSearch?: string;
  currentPage: number;
  pageSize: number;
};

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTimeShort(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "pharmacist", label: ROLE_LABELS.pharmacist },
  { value: "pharmacy_assistant", label: ROLE_LABELS.pharmacy_assistant },
];

export function TimeLogsTable({
  data,
  count,
  pharmacies,
  currentPharmacyId = "",
  currentRole = "",
  currentDateFrom = "",
  currentDateTo = "",
  currentSearch = "",
  currentPage,
  pageSize,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(currentSearch);
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);

  const hasActiveFilters =
    !!currentSearch ||
    !!currentRole ||
    !!currentDateFrom ||
    !!currentDateTo ||
    !!currentPharmacyId;

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
      if (!("page" in updates)) {
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

  const totalPages = Math.ceil(count / pageSize);
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, count);

  const columns = useMemo<ColumnDef<TillSessionWithRelations>[]>(
    () => [
      {
        id: "staff_name",
        header: "Staff Name",
        cell: ({ row }) => {
          const u = row.original.opened_by_user;
          if (!u) return <span className="text-muted-foreground">—</span>;
          return <span className="text-sm font-medium">{u.name}</span>;
        },
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => {
          const u = row.original.opened_by_user;
          if (!u) return <span className="text-muted-foreground">—</span>;
          const label = ROLE_LABELS[u.role as UserRole] ?? u.role;
          return <span className="text-sm text-muted-foreground">{label}</span>;
        },
      },
      {
        id: "pharmacy",
        header: "Pharmacy",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.pharmacies?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDateShort(row.original.opened_at)}
          </span>
        ),
      },
      {
        id: "time_in",
        header: "Time In",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {formatTimeShort(row.original.opened_at)}
          </span>
        ),
      },
      {
        id: "time_out",
        header: "Time Out",
        cell: ({ row }) => {
          const { status, closed_at } = row.original;
          if (!closed_at)
            return <span className="text-muted-foreground">—</span>;
          if (status === "force_closed") {
            return <span className="text-amber-600 text-sm">Auto-closed</span>;
          }
          return (
            <span className="text-sm tabular-nums">
              {formatTimeShort(closed_at)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-56">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by staff name..."
              value={searchValue}
              onChange={e => {
                setSearchValue(e.target.value);
                handleSearch(e.target.value);
              }}
              className="pl-8"
            />
          </div>

          {/* Pharmacy filter */}
          <Select
            value={currentPharmacyId || "all"}
            onValueChange={(value: string | null) => {
              if (!value) return;
              updateParams({ pharmacy: value === "all" ? null : value });
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Pharmacies">
                {currentPharmacyId
                  ? (pharmacies.find(p => p.id === currentPharmacyId)?.name ??
                    "All Pharmacies")
                  : "All Pharmacies"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pharmacies</SelectItem>
              {pharmacies.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Role filter */}
          <Select
            value={currentRole || "all"}
            onValueChange={(value: string | null) => {
              if (!value) return;
              updateParams({ role: value === "all" ? null : value });
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Roles">
                {currentRole
                  ? (ROLE_OPTIONS.find(r => r.value === currentRole)?.label ??
                    "All Roles")
                  : "All Roles"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ROLE_OPTIONS.map(r => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <Input
            type="date"
            value={dateFrom}
            onChange={e => {
              setDateFrom(e.target.value);
              updateParams({ dateFrom: e.target.value || null });
            }}
            className="w-36"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={e => {
              setDateTo(e.target.value);
              updateParams({ dateTo: e.target.value || null });
            }}
            className="w-36"
          />

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => {
                setSearchValue("");
                setDateFrom("");
                setDateTo("");
                startTransition(() => {
                  router.push(pathname);
                });
              }}
            >
              <XCircleIcon className="size-4" />
              Clear
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {count} {count === 1 ? "record" : "records"} found
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center text-muted-foreground"
                >
                  No time log records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Showing {startRow}–{endRow} of {count} records
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => updateParams({ page: String(currentPage - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => updateParams({ page: String(currentPage + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
