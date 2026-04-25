"use client";

import { useState } from "react";
import { ShoppingCartIcon, Trash2Icon, TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { usePOS } from "@/context/POSContext";
import { cn } from "@/lib/utils";
import { POSCartItem } from "./POSCartItem";
import { POSCartTotals } from "./POSCartTotals";
import { POSPaymentModal } from "./POSPaymentModal";
import { CartDiscountPopover } from "./CartDiscountPopover";

type POSCartPanelProps = {
  pharmacyId: string;
  paymentOpen: boolean;
  onPaymentOpenChange: (open: boolean) => void;
};

export function POSCartPanel({ pharmacyId, paymentOpen, onPaymentOpenChange }: POSCartPanelProps) {
  const { cartItems, itemCount, clearCart, cartDiscount, discountMode } = usePOS();
  const [cartDiscountOpen, setCartDiscountOpen] = useState(false);

  const hasItems = cartItems.length > 0;
  const isCartDiscountLocked = discountMode === 'per_item';

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-muted/90">
      {/* Cart header */}
      <div className="flex items-center gap-2 border-b px-4 py-3 shrink-0">
        <ShoppingCartIcon className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">Cart</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Items list — takes all available vertical space */}
      {hasItems ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 bg-white">
          {cartItems.map(item => (
            <POSCartItem key={item.inventoryId} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-2 text-muted-foreground">
          <ShoppingCartIcon className="size-10 opacity-30" />
          <p className="text-sm">Cart is empty</p>
          <p className="text-xs">Search for products to add</p>
        </div>
      )}

      {/* Footer: totals + process sale — anchored at bottom */}
      <div className="shrink-0 border-t px-4 pb-4">
        <POSCartTotals />
        <div className="flex gap-2">
          {/* Cart discount button */}
          <Popover open={cartDiscountOpen} onOpenChange={setCartDiscountOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "shrink-0",
                    cartDiscount !== null
                      ? "border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                      : isCartDiscountLocked
                        ? "border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                        : "border-border bg-background text-muted-foreground",
                  )}
                  disabled={isCartDiscountLocked}
                  title={
                    cartDiscount !== null
                      ? "Change or remove cart discount"
                      : isCartDiscountLocked
                        ? "Per-item discounts are active"
                        : "Apply cart discount"
                  }
                />
              }
            >
              <TagIcon className="size-3.5" />
            </PopoverTrigger>
            <CartDiscountPopover onClose={() => setCartDiscountOpen(false)} />
          </Popover>

          {/* Clear cart button */}
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-destructive hover:text-destructive"
            disabled={!hasItems}
            onClick={clearCart}
          >
            <Trash2Icon className="size-3.5" />
          </Button>

          <Button
            className="flex-1 font-bold text-base"
            size="lg"
            disabled={!hasItems}
            onClick={() => onPaymentOpenChange(true)}
          >
            PROCESS SALE
          </Button>
        </div>
      </div>

      <POSPaymentModal
        open={paymentOpen}
        onOpenChange={onPaymentOpenChange}
        pharmacyId={pharmacyId}
      />
    </div>
  );
}
