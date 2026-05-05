"use client";

import type { PurchaseOrderWithItems } from "@/types/inventory";
import { PO_STATUS_LABELS } from "@/types/inventory";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogClose } from "@/components/ui/dialog";
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
  if (status === "submitted")
    return <Badge variant="secondary">Submitted</Badge>;
  if (status === "partially_received")
    return (
      <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700">
        Partially Received
      </Badge>
    );
  if (status === "received")
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        Received
      </Badge>
    );
  return <Badge variant="destructive">Cancelled</Badge>;
}

export default function ViewPurchaseOrderModal({
  open,
  onOpenChange,
  po,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po: PurchaseOrderWithItems | null;
}) {
  if (!po) return null;

  const estimatedTotal = po.items.reduce(
    (sum, item) => sum + item.quantity_ordered * item.unit_cost,
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-2xl md:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Purchase Order Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">PO Number</p>
              <p className="text-lg font-mono font-medium">{po.po_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Status</p>
              <StatusBadge status={po.status} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Supplier</p>
              <p>
                {po.supplier?.name ?? (
                  <span className="text-muted-foreground">No Supplier</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Expected Delivery
              </p>
              <p>{formatDate(po.expected_delivery_date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Created By</p>
              <p>{po.created_by_user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Created At</p>
              <p>{formatDate(po.created_at)}</p>
            </div>
            {po.notes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
                <p className="whitespace-pre-wrap">{po.notes}</p>
              </div>
            )}
          </div>

          {/* Items table */}
          <div>
            <p className="text-sm font-semibold mb-2">
              Order Items ({po.items.length})
            </p>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.items.map(item => {
                    const lineTotal = item.quantity_ordered * item.unit_cost;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">
                          {item.products?.product_name ?? item.product_id}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {item.quantity_ordered}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {formatCurrency(item.unit_cost)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {formatCurrency(lineTotal)}
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
              <span className="text-muted-foreground">Estimated Total: </span>
              <span className="font-medium">
                {formatCurrency(estimatedTotal)}
              </span>
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
