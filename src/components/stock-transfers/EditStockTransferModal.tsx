"use client"

import { useState, useEffect, useTransition } from "react"
import { XIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { updateStockTransfer } from "@/app/admin/stock-transfers/actions"
import { getPharmacies } from "@/app/admin/pharmacies/actions"
import { getProducts } from "@/app/admin/products/actions"
import { getAvailableBatchesForProduct } from "@/app/admin/warehouse/actions"
import type { StockTransferWithItems } from "@/types/inventory"
import type { Pharmacy } from "@/types/pharmacy"
import type { WarehouseInventoryWithProduct } from "@/types/inventory"
import type { ProductOption } from "@/components/ui/product-combobox"
import { ProductCombobox } from "@/components/ui/product-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ItemRow = {
  product_id: string
  product_name: string
  warehouse_inventory_id: string
  quantity: number
  expiry_date: string | null
}

function emptyRow(): ItemRow {
  return {
    product_id: "",
    product_name: "",
    warehouse_inventory_id: "",
    quantity: 1,
    expiry_date: null,
  }
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "No Exp"
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function EditStockTransferModal({
  open,
  onOpenChange,
  transfer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  transfer: StockTransferWithItems | null
}) {
  const [pharmacyId, setPharmacyId] = useState<string>(
    transfer?.to_pharmacy_id ?? "",
  )
  const [notes, setNotes] = useState<string>(transfer?.notes ?? "")
  const [items, setItems] = useState<ItemRow[]>(
    transfer?.items?.length
      ? transfer.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product?.product_name ?? "",
          warehouse_inventory_id: item.warehouse_inventory_id,
          quantity: item.quantity,
          expiry_date: item.expiry_date,
        }))
      : [emptyRow()],
  )
  const [itemsError, setItemsError] = useState<string | null>(null)

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [batchesByProduct, setBatchesByProduct] = useState<
    Map<string, WarehouseInventoryWithProduct[]>
  >(new Map())
  const [loadingBatches, setLoadingBatches] = useState<Set<string>>(new Set())

  const [isPending, startTransition] = useTransition()

  // Defined before useEffect so react-compiler can see it
  const fetchBatchesForProduct = (productId: string) => {
    if (!productId || batchesByProduct.has(productId)) return
    setLoadingBatches(prev => new Set(prev).add(productId))
    getAvailableBatchesForProduct(productId)
      .then(batches => {
        setBatchesByProduct(prev => new Map(prev).set(productId, batches))
      })
      .catch(() => {})
      .finally(() => {
        setLoadingBatches(prev => {
          const next = new Set(prev)
          next.delete(productId)
          return next
        })
      })
  }

  useEffect(() => {
    getPharmacies()
      .then(data => setPharmacies(data))
      .catch(() => {})
    getProducts({ status: "active", pageSize: 1000 })
      .then(({ data }) =>
        setProducts(
          data.map(p => ({
            id: p.id,
            name: p.product_name,
            generic_name: p.generic_name,
            base_price: p.unit_cost,
          })),
        ),
      )
      .catch(() => {})
    // Pre-fetch batches for all products in existing items (fully async — no sync setState)
    const uniqueProductIds = [
      ...new Set(
        (transfer?.items ?? []).map(i => i.product_id).filter(Boolean),
      ),
    ]
    if (uniqueProductIds.length > 0) {
      Promise.all(
        uniqueProductIds.map(productId =>
          getAvailableBatchesForProduct(productId).then(batches => ({
            productId,
            batches,
          })),
        ),
      )
        .then(results => {
          setBatchesByProduct(prev => {
            const next = new Map(prev)
            for (const { productId, batches } of results) {
              next.set(productId, batches)
            }
            return next
          })
        })
        .catch(() => {})
    }
  }, [])

  const updateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems(prev =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleProductChange = (index: number, p: ProductOption | null) => {
    updateItem(index, {
      product_id: p?.id ?? "",
      product_name: p?.name ?? "",
      warehouse_inventory_id: "",
      expiry_date: null,
    })
    if (p?.id) fetchBatchesForProduct(p.id)
  }

  const handleBatchChange = (
    index: number,
    batchId: string | null,
    productId: string,
  ) => {
    if (!batchId) return
    const batch = (batchesByProduct.get(productId) ?? []).find(
      b => b.id === batchId,
    )
    if (!batch) return
    updateItem(index, {
      warehouse_inventory_id: batchId,
      expiry_date: batch.expiry_date,
    })
  }

  const usedBatchIds = (excludeIndex: number) =>
    new Set(
      items
        .filter((_, i) => i !== excludeIndex)
        .map(r => r.warehouse_inventory_id)
        .filter(Boolean),
    )

  const totalQty = items
    .filter(r => r.warehouse_inventory_id)
    .reduce((sum, r) => sum + r.quantity, 0)

  const handleSubmit = () => {
    if (!transfer) return
    const validItems = items.filter(
      r => r.product_id && r.warehouse_inventory_id,
    )
    if (!pharmacyId) {
      setItemsError("Please select a destination pharmacy.")
      return
    }
    if (validItems.length === 0) {
      setItemsError(
        "At least one item with a selected product and batch is required.",
      )
      return
    }
    setItemsError(null)

    startTransition(async () => {
      const result = await updateStockTransfer(transfer.id, {
        to_pharmacy_id: pharmacyId,
        notes: notes.trim() || null,
        items: validItems.map(row => ({
          warehouse_inventory_id: row.warehouse_inventory_id,
          product_id: row.product_id,
          quantity: row.quantity,
          expiry_date: row.expiry_date,
        })),
      })

      if (result.success) {
        toast.success("Stock transfer updated.")
        onOpenChange(false)
      } else {
        toast.error(result.error ?? "Failed to update stock transfer.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col max-h-[90vh] sm:max-w-4xl md:max-w-5xl p-0"
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-0">
          <DialogTitle>Edit Stock Transfer</DialogTitle>
          <DialogDescription>Update this draft transfer.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Transfer number (read-only) */}
          {transfer && (
            <div className="flex flex-col gap-1.5 mb-5">
              <Label className="text-xs text-muted-foreground">
                Transfer Number
              </Label>
              <div className="font-mono bg-muted px-3 py-2 rounded-md text-sm">
                {transfer.transfer_number}
              </div>
            </div>
          )}

          {/* Header fields */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-st-pharmacy">Destination Pharmacy</Label>
              <Select
                value={pharmacyId}
                onValueChange={v => v !== null && setPharmacyId(v)}
              >
                <SelectTrigger id="edit-st-pharmacy">
                  <SelectValue>
                    {pharmacyId
                      ? (pharmacies.find(p => p.id === pharmacyId)?.name ??
                        "Select pharmacy")
                      : "Select destination pharmacy"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {pharmacies.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="edit-st-notes">Notes</Label>
              <Textarea
                id="edit-st-notes"
                placeholder="Optional notes…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Line items */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-semibold">Transfer Items</Label>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_220px_80px_32px] gap-2 px-1">
              <span className="text-xs text-muted-foreground">Product</span>
              <span className="text-xs text-muted-foreground">
                Batch (Lot / Expiry / Available)
              </span>
              <span className="text-xs text-muted-foreground">Qty</span>
              <span />
            </div>

            {items.map((row, i) => {
              const batches = batchesByProduct.get(row.product_id) ?? []
              const used = usedBatchIds(i)
              const availableBatches = batches.filter(b => !used.has(b.id))
              const isLoadingBatch = loadingBatches.has(row.product_id)
              const selectedBatch = batches.find(
                b => b.id === row.warehouse_inventory_id,
              )

              return (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_220px_80px_32px] gap-2 items-center"
                >
                  <ProductCombobox
                    options={products}
                    value={row.product_id}
                    onChange={p => handleProductChange(i, p)}
                    placeholder="Search product…"
                  />

                  <Select
                    value={row.warehouse_inventory_id}
                    onValueChange={v =>
                      handleBatchChange(i, v, row.product_id)
                    }
                    disabled={!row.product_id || isLoadingBatch}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {isLoadingBatch
                          ? "Loading…"
                          : selectedBatch
                            ? `${selectedBatch.lot_number ?? "No Lot"} | ${formatDateShort(selectedBatch.expiry_date)} | ${selectedBatch.quantity_remaining} avail`
                            : row.warehouse_inventory_id
                              ? "Loading batch…"
                              : row.product_id
                                ? availableBatches.length === 0
                                  ? "No batches available"
                                  : "Select batch…"
                                : "Select product first"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableBatches.map(batch => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {`${batch.lot_number ?? "No Lot"} | ${formatDateShort(batch.expiry_date)} | ${batch.quantity_remaining} avail`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    min={1}
                    max={selectedBatch?.quantity_remaining || undefined}
                    value={row.quantity}
                    onChange={e =>
                      updateItem(i, {
                        quantity: Math.max(1, Number(e.target.value)),
                      })
                    }
                    disabled={!row.warehouse_inventory_id}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    aria-label="Remove item"
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              )
            })}

            {itemsError && (
              <p className="text-sm text-destructive">{itemsError}</p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setItems(prev => [...prev, emptyRow()])}
            >
              <PlusIcon className="size-4" />
              Add Item
            </Button>

            <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground border-t">
              <span>
                Total Items:{" "}
                <span className="font-medium text-foreground">
                  {items.filter(r => r.warehouse_inventory_id).length}
                </span>
              </span>
              <span>|</span>
              <span>
                Total Units:{" "}
                <span className="font-medium text-foreground">{totalQty}</span>
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 px-6 pb-6 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
