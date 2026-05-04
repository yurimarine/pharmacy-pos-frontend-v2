"use client"

import type { StockTransferWithItems } from "@/types/inventory"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function StatusBadge({ status }: { status: string }) {
  if (status === "draft") return <Badge variant="outline">Draft</Badge>
  if (status === "completed")
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        Completed
      </Badge>
    )
  return <Badge variant="destructive">Cancelled</Badge>
}

export default function ViewStockTransferModal({
  open,
  onOpenChange,
  transfer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  transfer: StockTransferWithItems | null
}) {
  if (!transfer) return null

  const totalQty = transfer.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-2xl md:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Stock Transfer Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Transfer Number
              </p>
              <p className="text-lg font-mono font-medium">
                {transfer.transfer_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Status</p>
              <StatusBadge status={transfer.status} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Destination Pharmacy
              </p>
              <p>
                {transfer.to_pharmacy?.name ?? (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Transferred By
              </p>
              <p>{transfer.transferred_by_user?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Transferred At
              </p>
              <p>{formatDate(transfer.transferred_at)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Created At</p>
              <p>{formatDate(transfer.created_at)}</p>
            </div>
            {transfer.notes && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Notes</p>
                <p className="whitespace-pre-wrap">{transfer.notes}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">
              Transfer Items ({transfer.items.length})
            </p>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Lot #</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfer.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {item.product?.product_name ?? item.product_id}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {item.product?.sku ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.batch?.lot_number ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(item.expiry_date)}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {item.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-right mt-2">
              <span className="text-muted-foreground">Total Units: </span>
              <span className="font-medium">{totalQty}</span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
