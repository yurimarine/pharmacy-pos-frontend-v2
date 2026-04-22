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
import { EllipsisVerticalIcon } from "lucide-react";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Transaction, TransactionStatus } from "@/types/transaction";
import { ROLE_LABELS } from "@/types/user";

const STATUS_LABELS: Record<string, string> = {
  all: "All Status",
  completed: "Completed",
  voided: "Voided",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  if (status === "completed") {
    return <Badge className="bg-green-500 hover:bg-green-500">Completed</Badge>;
  }
  return <Badge variant="destructive">Voided</Badge>;
}

type TransactionsTableProps = {
  transactions: Transaction[];
  pharmacies: { id: string; name: string }[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  currentSearch: string;
  currentStatus: string;
  currentPharmacyId: string;
  currentDateFrom: string;
  currentDateTo: string;
  isAdmin: boolean;
  currentUserId: string;
  basePath?: string;
};

export function TransactionsTable({
  transactions,
  pharmacies,
  totalCount,
  currentPage,
  pageSize,
  currentSearch,
  currentStatus,
  currentPharmacyId,
  currentDateFrom,
  currentDateTo,
  isAdmin,
  basePath = "/admin/transactions",
}: TransactionsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(currentSearch);
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);

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
      // Reset to page 1 on filter change
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

  const totalPages = Math.ceil(totalCount / pageSize);

  const columns = useMemo<ColumnDef<Transaction>[]>(() => {
    const cols: ColumnDef<Transaction>[] = [
      {
        accessorKey: "transaction_number",
        header: "Transaction #",
        cell: ({ row }) => (
          <span
            className="font-mono font-semibold text-sm cursor-pointer hover:underline"
            onClick={() => router.push(`${basePath}/${row.original.id}`)}
          >
            {row.getValue("transaction_number")}
          </span>
        ),
      },
      ...(isAdmin
        ? ([
            {
              id: "pharmacy",
              header: "Pharmacy",
              cell: ({ row }) => (
                <span className="text-sm">
                  {row.original.pharmacies?.name ?? "—"}
                </span>
              ),
            },
          ] satisfies ColumnDef<Transaction>[])
        : []),
      {
        id: "cashier",
        header: "Cashier",
        cell: ({ row }) => {
          const u = row.original.users;
          if (!u)
            return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <div className="flex flex-col">
              <span className="text-sm font-medium">{u.name}</span>
              <span className="text-xs text-muted-foreground">
                {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
              </span>
            </div>
          );
        },
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => {
          const count = row.original.transaction_items?.length ?? 0;
          return (
            <Badge variant="secondary" className="font-mono">
              {count}
            </Badge>
          );
        },
      },
      {
        accessorKey: "total_amount",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-semibold">
            ₱{row.original.total_amount.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: "payment_method",
        header: "Payment",
        cell: () => <Badge variant="secondary">Cash</Badge>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(row.getValue("created_at"))}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <EllipsisVerticalIcon className="size-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`${basePath}/${row.original.id}`)}
              >
                View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];
    return cols;
  }, [isAdmin, router, basePath]);

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Search */}
          <Input
            placeholder="Search by transaction number..."
            value={searchValue}
            onChange={e => {
              setSearchValue(e.target.value);
              handleSearch(e.target.value);
            }}
            className="w-64"
          />

          <div className="flex items-center gap-1">
            {/* Status filter */}
            <Select
              value={currentStatus}
              onValueChange={(value: string | null) => {
                if (!value) return;
                updateParams({ status: value === "all" ? null : value });
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status">
                  {STATUS_LABELS[currentStatus] ?? "All Status"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
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
          </div>

          {/* Pharmacy filter — admin only */}
          {isAdmin && pharmacies.length > 0 && (
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
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {totalCount} {totalCount === 1 ? "transaction" : "transactions"} found
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
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
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`${basePath}/${row.original.id}`)}
                >
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
                  No transactions found.
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
            Page {currentPage} of {totalPages}
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
