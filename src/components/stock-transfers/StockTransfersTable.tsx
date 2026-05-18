"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Ban,
  CircleCheck,
  EllipsisVerticalIcon,
  Eye,
  Pencil,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import {
  completeStockTransfer,
  cancelStockTransfer,
} from "@/app/admin/stock-transfers/actions";
import type {
  StockTransferWithItems,
  StockTransferStatus,
} from "@/types/inventory";
import { ST_STATUS_LABELS } from "@/types/inventory";
import type { Pharmacy } from "@/types/pharmacy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ViewStockTransferModal from "./ViewStockTransferModal";

const STATUS_COLORS: Record<StockTransferStatus, string> = {
  draft: "bg-muted text-muted-foreground border",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-destructive/10 text-destructive",
};

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
          ? "No transfers"
          : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, count)} of ${count}`}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
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

type ConfirmState =
  | { action: "complete"; transfer: StockTransferWithItems }
  | { action: "cancel"; transfer: StockTransferWithItems }
  | null;

export default function StockTransfersTable({
  transfers,
  count,
  page,
  pageSize,
  pharmacies,
}: {
  transfers: StockTransferWithItems[];
  count: number;
  page: number;
  pageSize: number;
  pharmacies: Pharmacy[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [, startActing] = useTransition();

  const [viewTransfer, setViewTransfer] =
    useState<StockTransferWithItems | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") ?? "",
  );

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.delete("page");
    startTransition(() => router.push(`?${params.toString()}`));
  };

  const handleSearch = useDebouncedCallback((value: string) => {
    pushParams({ search: value });
  }, 400);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    startTransition(() => router.push(`?${params.toString()}`));
  };

  const handleConfirmAction = () => {
    if (!confirmState) return;
    const { action, transfer } = confirmState;
    setConfirmState(null);
    startActing(async () => {
      const result =
        action === "complete"
          ? await completeStockTransfer(transfer.id)
          : await cancelStockTransfer(transfer.id);
      if (result.success) {
        toast.success(
          action === "complete"
            ? "Transfer completed successfully."
            : "Transfer cancelled.",
        );
      } else {
        toast.error(result.error ?? `Failed to ${action} transfer.`);
      }
    });
  };

  const columns: ColumnDef<StockTransferWithItems>[] = [
    {
      accessorKey: "transfer_number",
      header: "Transfer #",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.transfer_number}
        </span>
      ),
    },
    {
      id: "to_pharmacy",
      header: "Destination",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.to_pharmacy?.name ?? (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      ),
    },
    {
      id: "items_count",
      header: "Items",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.items.length}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.original.status]}`}
        >
          {ST_STATUS_LABELS[row.original.status]}
        </span>
      ),
    },
    {
      id: "transferred_by",
      header: "By",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.transferred_by_user?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "transferred_at",
      header: "Transferred At",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.transferred_at)}
        </span>
      ),
    },
    {
      id: "created_at",
      header: "Created At",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => {
        const isDraft = row.original.status === "draft";
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
            <DropdownMenuContent align="end" className="w-fit min-w-0 p-1">
              <DropdownMenuGroup>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <DropdownMenuItem
                        className={"h-8 w-8 p-0 justify-center"}
                        onClick={() => setViewTransfer(row.original)}
                      >
                        <Eye className="size-4" />
                      </DropdownMenuItem>
                    }
                  ></TooltipTrigger>
                  <TooltipContent>
                    <p>View Details</p>
                  </TooltipContent>
                </Tooltip>
              </DropdownMenuGroup>
              {isDraft && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <DropdownMenuItem
                            className={"h-8 w-8 p-0 justify-center"}
                            onClick={() =>
                              router.push(
                                `/admin/stock-transfers/${row.original.id}/edit`,
                              )
                            }
                          >
                            <Pencil className="size-4 text-blue-600" />
                          </DropdownMenuItem>
                        }
                      ></TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <DropdownMenuItem
                            className={"h-8 w-8 p-0 justify-center"}
                            onClick={() =>
                              setConfirmState({
                                action: "complete",
                                transfer: row.original,
                              })
                            }
                          >
                            <CircleCheck className="size-4 text-green-600" />
                          </DropdownMenuItem>
                        }
                      ></TooltipTrigger>
                      <TooltipContent>
                        <p>Complete Transfer</p>
                      </TooltipContent>
                    </Tooltip>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <DropdownMenuItem
                            className={"h-8 w-8 p-0 justify-center"}
                            variant="destructive"
                            onClick={() =>
                              setConfirmState({
                                action: "cancel",
                                transfer: row.original,
                              })
                            }
                          >
                            <Ban className="size-4 text-destructive" />
                          </DropdownMenuItem>
                        }
                      ></TooltipTrigger>
                      <TooltipContent>
                        <p>Cancel</p>
                      </TooltipContent>
                    </Tooltip>
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: transfers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search transfer number…"
            value={searchValue}
            onChange={e => {
              setSearchValue(e.target.value);
              handleSearch(e.target.value);
            }}
          />
        </div>

        <Select
          value={searchParams.get("status") ?? ""}
          onValueChange={v => pushParams({ status: v || null })}
        >
          <SelectTrigger className="w-36">
            <SelectValue>
              {searchParams.get("status")
                ? ST_STATUS_LABELS[
                    searchParams.get("status") as StockTransferStatus
                  ]
                : "All Statuses"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {(["draft", "completed", "cancelled"] as StockTransferStatus[]).map(
              s => (
                <SelectItem key={s} value={s}>
                  {ST_STATUS_LABELS[s]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("pharmacy_id") ?? ""}
          onValueChange={v => pushParams({ pharmacy_id: v || null })}
        >
          <SelectTrigger className="w-44">
            <SelectValue>
              {searchParams.get("pharmacy_id")
                ? (pharmacies.find(
                    p => p.id === searchParams.get("pharmacy_id"),
                  )?.name ?? "All Pharmacies")
                : "All Pharmacies"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Pharmacies</SelectItem>
            {pharmacies.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          className="ml-auto"
          onClick={() => router.push("/admin/stock-transfers/new")}
        >
          <PlusIcon />
          New Transfer
        </Button>
      </div>

      {/* Table */}
      <div
        className={`rounded-md border ${isPending ? "opacity-60 pointer-events-none" : ""}`}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
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
                  className="text-center text-muted-foreground py-10"
                >
                  No stock transfers found.
                </TableCell>
              </TableRow>
            ) : (
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
      <ViewStockTransferModal
        open={viewTransfer !== null}
        onOpenChange={open => !open && setViewTransfer(null)}
        transfer={viewTransfer}
      />

      {/* Confirm dialog */}
      <AlertDialog
        open={confirmState !== null}
        onOpenChange={open => !open && setConfirmState(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmState?.action === "complete"
                ? "Complete Transfer"
                : "Cancel Transfer"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmState?.action === "complete"
                ? `This will deduct stock from the warehouse and add it to the destination pharmacy. Transfer ${confirmState.transfer.transfer_number} cannot be undone.`
                : `Cancel transfer ${confirmState?.transfer.transfer_number}? No stock will be moved.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmState?.action === "cancel"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmState?.action === "complete"
                ? "Complete"
                : "Cancel Transfer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
