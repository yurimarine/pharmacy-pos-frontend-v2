"use client";

import type { WarehouseReceiptWithItems } from "@/types/warehouse-receipt";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
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

function StatusBadge({ status }: { status: string }) {
  if (status === "draft") return <Badge variant="outline">Draft</Badge>;
  if (status === "completed")
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        Completed
      </Badge>
    );
  return <Badge variant="destructive">Cancelled</Badge>;
}

export default function ViewWarehouseReceiptModal({
  open,
  onOpenChange,
  receipt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: WarehouseReceiptWithItems | null;
}) {
  if (!receipt) return null;

  const totalCost = receipt.items.reduce(
    (sum, item) => sum + item.quantity_received * item.unit_cost,
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-2xl md:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Warehouse Receipt Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Receipt Number
              </p>
              <p className="text-lg font-mono font-medium">
                {receipt.receipt_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Status</p>
              <StatusBadge status={receipt.status} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Supplier</p>
              <p>
                {receipt.supplier?.name ?? (
                  <span className="text-muted-foreground">No Supplier</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Purchase Order
              </p>
              <p>
                {receipt.po?.po_number ? (
                  <span className="font-mono">{receipt.po.po_number}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Received By
              </p>
              <p>{receipt.received_by_user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Received At
              </p>
              <p>{formatDate(receipt.received_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Created At</p>
              <p>{formatDate(receipt.created_at)}</p>
            </div>
            {receipt.notes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
                <p className="whitespace-pre-wrap">{receipt.notes}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">
              Receipt Items ({receipt.items.length})
            </p>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                    <TableHead>Lot #</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.items.map(item => {
                    const lineTotal = item.quantity_received * item.unit_cost;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">
                          {item.products?.product_name ?? item.product_id}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {item.products?.sku ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {item.quantity_received}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {formatCurrency(item.unit_cost)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {formatCurrency(lineTotal)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.lot_number ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(item.expiry_date)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-right mt-2">
              <span className="text-muted-foreground">Total Cost: </span>
              <span className="font-medium">{formatCurrency(totalCost)}</span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
