"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  cancelBatch,
  getProductsForBatchSelect,
  getSuppliersForBatchSelect,
  getManufacturersForBatchSelect,
} from "@/app/admin/batches/actions";
import type { BatchWithItems, BatchItem } from "@/types/batch";
import { AddBatchItemModal } from "@/components/batches/AddBatchItemModal";
import { RemoveBatchItemDialog } from "@/components/batches/RemoveBatchItemDialog";
import { FinalizeBatchDialog } from "@/components/batches/FinalizeBatchDialog";
import { CancelBatchDialog } from "@/components/batches/CancelBatchDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, Trash2Icon } from "lucide-react";

type Product = {
  id: string;
  name: string;
  generic_name: string | null;
  base_price: number;
  current_quantity?: number;
};

type Supplier = { id: string; name: string };
type Manufacturer = { id: string; name: string };

type BatchDetailProps = {
  batch: BatchWithItems;
  isAdmin: boolean;
};

function TypeBadge({ type }: { type: BatchWithItems["type"] }) {
  if (type === "stock_in") {
    return <Badge variant="default">Stock In</Badge>;
  }
  return (
    <Badge className="bg-orange-100 text-orange-800 border-transparent hover:bg-orange-100">
      Stock Out
    </Badge>
  );
}

function StatusBadge({ status }: { status: BatchWithItems["status"] }) {
  if (status === "completed") {
    return (
      <Badge className="bg-green-100 text-green-800 border-transparent hover:bg-green-100">
        Completed
      </Badge>
    );
  }
  if (status === "cancelled") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Cancelled
      </Badge>
    );
  }
  return <Badge variant="outline">Draft</Badge>;
}

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "MMM d, yyyy h:mm a");
  } catch {
    return dateStr;
  }
}

export function BatchDetail({
  batch: initialBatch,
  isAdmin,
}: BatchDetailProps) {
  const [batch, setBatch] = useState<BatchWithItems>(initialBatch);
  const [addOpen, setAddOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BatchItem | null>(null);

  // Lazy-loaded select data
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectDataLoaded, setSelectDataLoaded] = useState(false);
  const [, startLoadTransition] = useTransition();

  useEffect(() => {
    setBatch(initialBatch);
  }, [initialBatch]);

  const loadSelectData = () => {
    if (selectDataLoaded) return;
    startLoadTransition(async () => {
      try {
        const [prods, supps, mfrs] = await Promise.all([
          getProductsForBatchSelect(batch.pharmacy_id, batch.type),
          getSuppliersForBatchSelect(),
          getManufacturersForBatchSelect(),
        ]);
        setProducts(prods);
        setSuppliers(supps);
        setManufacturers(mfrs);
        setSelectDataLoaded(true);
      } catch {
        toast.error("Failed to load product data.");
      }
    });
  };

  const handleOpenAdd = () => {
    loadSelectData();
    setAddOpen(true);
  };

  const handleOpenRemove = (item: BatchItem) => {
    setSelectedItem(item);
    setRemoveOpen(true);
  };

  const handleItemAdded = (item: BatchItem) => {
    setBatch(prev => ({
      ...prev,
      batch_items: [...prev.batch_items, item],
    }));
  };

  const handleItemRemoved = (itemId: string) => {
    setBatch(prev => ({
      ...prev,
      batch_items: prev.batch_items.filter(i => i.id !== itemId),
    }));
  };

  const handleCancelled = () => {
    setBatch(prev => ({ ...prev, status: "cancelled" }));
  };

  const isDraft = batch.status === "draft";
  const items = batch.batch_items ?? [];

  return (
    <>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="font-mono text-xl">
                {batch.batch_number}
              </CardTitle>
              <TypeBadge type={batch.type} />
              <StatusBadge status={batch.status} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Pharmacy</span>
              <span className="text-sm font-medium">
                {batch.pharmacy?.name ?? "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Created By</span>
              <span className="text-sm font-medium">
                {batch.users?.name ?? "—"}
                {batch.users?.role && (
                  <span className="text-muted-foreground ml-1">
                    ({batch.users.role})
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Created At</span>
              <span className="text-sm font-medium">
                {formatDate(batch.created_at)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Last Updated
              </span>
              <span className="text-sm font-medium">
                {formatDate(batch.updated_at)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Items</span>
              <span className="text-sm font-medium">{items.length}</span>
            </div>
            {batch.type === "stock_in" && batch.transfer_to_pharmacy_id == null
              ? null
              : null}
          </div>
          {batch.notes && (
            <p className="mt-4 text-sm text-muted-foreground border-t pt-3">
              {batch.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Items Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
          {isDraft && (
            <Button size="sm" onClick={handleOpenAdd}>
              <PlusIcon className="size-4 mr-1" />
              Add Item
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Generic Name</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                {batch.type === "stock_in" ? (
                  <>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Manufacturer</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead>Reason</TableHead>
                  </>
                )}
                <TableHead>Notes</TableHead>
                {isDraft && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      batch.type === "stock_in"
                        ? isDraft
                          ? 9
                          : 8
                        : isDraft
                          ? 7
                          : 6
                    }
                    className="text-center text-muted-foreground py-8"
                  >
                    No items added yet.
                    {isDraft && ' Click "Add Item" to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.products?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.products?.generic_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    {batch.type === "stock_in" ? (
                      <>
                        <TableCell className="text-right">
                          {item.unit_cost != null
                            ? `₱${Number(item.unit_cost).toFixed(2)}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {item.expiry_date
                            ? format(new Date(item.expiry_date), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>{item.suppliers?.name ?? "—"}</TableCell>
                        <TableCell>{item.manufacturers?.name ?? "—"}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right">
                          {item.inventory_quantity != null
                            ? item.inventory_quantity
                            : "—"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {item.reason ?? "—"}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-muted-foreground max-w-40 truncate">
                      {item.notes ?? "—"}
                    </TableCell>
                    {isDraft && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleOpenRemove(item)}
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer Actions */}
      {isDraft && (
        <div className="flex justify-end gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              Cancel Batch
            </Button>
          )}
          <Button
            onClick={() => setFinalizeOpen(true)}
            disabled={items.length === 0}
          >
            Finalize Batch
          </Button>
        </div>
      )}

      {/* Modals */}
      <AddBatchItemModal
        open={addOpen}
        onOpenChange={setAddOpen}
        batch={batch}
        products={products}
        suppliers={suppliers}
        manufacturers={manufacturers}
        onAdded={handleItemAdded}
      />
      <RemoveBatchItemDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        item={selectedItem}
        onRemoved={handleItemRemoved}
      />
      <FinalizeBatchDialog
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        batch={batch}
      />
      <CancelBatchDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        batchId={batch.id}
        batchNumber={batch.batch_number}
        onCancelled={handleCancelled}
      />
    </>
  );
}
