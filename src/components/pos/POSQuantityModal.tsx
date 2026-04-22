"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePOS, type POSInventoryItem } from "@/context/POSContext";
import { getStockStatus } from "@/lib/inventory-utils";

type POSQuantityModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: POSInventoryItem | null;
};

export function POSQuantityModal({
  open,
  onOpenChange,
  item,
}: POSQuantityModalProps) {
  const { addToCartWithQuantity, cartItems } = usePOS();
  const [quantity, setQuantity] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!item) return null;

  const stockStatus = getStockStatus(
    item.quantity,
    item.lowStockThreshold,
    item.expiryDate,
  );
  const isDisabled =
    stockStatus === "out_of_stock" || stockStatus === "expired";

  const alreadyInCart =
    cartItems.find(c => c.inventoryId === item.inventoryId)?.quantity ?? 0;
  const remaining = item.quantity - alreadyInCart;
  const maxQty = Math.max(remaining, 0);

  const isInvalid = quantity < 1 || quantity > maxQty || isDisabled;

  const handleConfirm = () => {
    if (isInvalid) return;
    addToCartWithQuantity(item, quantity);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">Add to Cart</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium truncate">{item.productName}</p>
            {item.productGenericName && (
              <p className="text-muted-foreground text-xs mt-0.5">
                {item.productGenericName}
              </p>
            )}
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-muted-foreground">
                Available: {maxQty}{" "}
                {alreadyInCart > 0 ? `(${alreadyInCart} in cart)` : ""}
              </span>
              <span className="font-semibold">
                ₱{item.sellingPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="qty-modal-input"
              className="text-xs text-muted-foreground"
            >
              Quantity
            </Label>
            <Input
              ref={inputRef}
              id="qty-modal-input"
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              onKeyDown={e => {
                if (e.key === "Enter") handleConfirm();
              }}
              className="text-center text-2xl font-mono h-auto py-2"
              disabled={isDisabled || maxQty === 0}
            />
            {quantity > maxQty && maxQty > 0 && (
              <p className="text-xs text-destructive">
                Max available: {maxQty}
              </p>
            )}
            {maxQty === 0 && (
              <p className="text-xs text-destructive">
                No more stock available
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={isInvalid}
            onClick={handleConfirm}
          >
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
