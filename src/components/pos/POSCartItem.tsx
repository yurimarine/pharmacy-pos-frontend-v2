"use client";

import { Trash2Icon, MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CartItem } from "@/types/cart";
import { usePOS } from "@/context/POSContext";

type POSCartItemProps = {
  item: CartItem;
};

export function POSCartItem({ item }: POSCartItemProps) {
  const { removeFromCart, updateQuantity } = usePOS();

  return (
    <div className="flex flex-col gap-1.5 py-3 border-b last:border-b-0">
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
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => removeFromCart(item.inventoryId)}
        >
          <Trash2Icon className="size-3.5" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Qty stepper */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => updateQuantity(item.inventoryId, item.quantity - 1)}
          >
            <MinusIcon className="size-3" />
          </Button>
          <Input
            className="w-12 h-7 text-center text-sm p-0"
            type="number"
            min={1}
            max={item.maxQuantity}
            value={item.quantity}
            onChange={e =>
              updateQuantity(item.inventoryId, parseInt(e.target.value) || 1)
            }
          />
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            disabled={item.quantity >= item.maxQuantity}
            onClick={() => updateQuantity(item.inventoryId, item.quantity + 1)}
          >
            <PlusIcon className="size-3" />
          </Button>
          <span className="text-xs text-muted-foreground">
            × ₱{item.unitPrice.toFixed(2)}
          </span>
        </div>

        {/* Line total */}
        <span className="font-semibold text-sm shrink-0">
          ₱{item.totalPrice.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
