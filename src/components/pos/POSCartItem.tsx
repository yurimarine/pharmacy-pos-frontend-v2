"use client";

import { useState } from "react";
import { Trash2Icon, TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import type { CartItem } from "@/types/cart";
import { usePOS } from "@/context/POSContext";
import { formatDiscountLabel } from "@/types/discount";
import { ItemDiscountPopover } from "@/components/pos/ItemDiscountPopover";
import { cn } from "@/lib/utils";

type POSCartItemProps = {
  item: CartItem;
};

export function POSCartItem({ item }: POSCartItemProps) {
  const { removeFromCart, updateQuantity, discountMode } = usePOS();
  const [discountPopoverOpen, setDiscountPopoverOpen] = useState(false);

  const itemDiscount = item.discount;
  const hasDiscount = itemDiscount !== null;
  const isItemDiscountLocked = discountMode === "whole_cart";

  const discountedTotal = item.unitPrice * item.quantity - item.discountAmount;

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b last:border-b-0">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium leading-tight truncate">
            {item.productName}
          </span>
          {item.productGenericName && (
            <span className="text-xs text-muted-foreground truncate">
              {item.productGenericName}
            </span>
          )}
          {item.productSku && (
            <span className="font-mono text-xs text-muted-foreground">
              {item.productSku}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Discount button */}
          <Popover open={discountPopoverOpen} onOpenChange={setDiscountPopoverOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-7",
                    hasDiscount
                      ? "border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                      : isItemDiscountLocked
                        ? "border border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                        : "border border-border bg-muted text-muted-foreground",
                  )}
                  disabled={isItemDiscountLocked}
                  title={
                    hasDiscount
                      ? "Change or remove discount"
                      : isItemDiscountLocked
                        ? "Cart discount is active"
                        : "Apply item discount"
                  }
                />
              }
            >
              <TagIcon className="size-3.5" />
              <span className="sr-only">
                {hasDiscount ? "Change or remove discount" : "Apply item discount"}
              </span>
            </PopoverTrigger>
            <ItemDiscountPopover
              inventoryId={item.inventoryId}
              currentDiscount={item.discount}
              onClose={() => setDiscountPopoverOpen(false)}
            />
          </Popover>

          {/* Remove button */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={() => removeFromCart(item.inventoryId)}
          >
            <Trash2Icon className="size-3.5" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      </div>

      {/* Discount line — only shown when a discount is applied */}
      {hasDiscount && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-600 dark:text-blue-400">
            {formatDiscountLabel(itemDiscount)} · -₱{item.discountAmount.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground line-through">
            ₱{(item.unitPrice * item.quantity).toFixed(2)}
          </span>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2">
        {/* Qty stepper */}
        <div className="flex items-center gap-1">
          <QuantityInput
            value={item.quantity}
            onChange={(v) => updateQuantity(item.inventoryId, v)}
            min={1}
            max={item.maxQuantity}
          />
          <span className="text-xs text-muted-foreground">
            × ₱{item.unitPrice.toFixed(2)}
          </span>
        </div>

        {/* Line total */}
        <span className="font-semibold text-sm shrink-0">
          ₱{hasDiscount ? discountedTotal.toFixed(2) : item.totalPrice.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
