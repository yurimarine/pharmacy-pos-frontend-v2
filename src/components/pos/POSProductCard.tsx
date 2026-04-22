"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "@/types/inventory";
import type { POSInventoryItem } from "@/context/POSContext";

type POSProductCardProps = {
  item: POSInventoryItem;
  stockStatus: StockStatus;
  onAddToCart: () => void;
};

function StockIndicator({
  status,
  quantity,
}: {
  status: StockStatus;
  quantity: number;
}) {
  if (status === "out_of_stock")
    return <span className="text-destructive">Out of stock</span>;
  if (status === "expired")
    return <span className="text-destructive">Expired</span>;
  if (status === "low_stock")
    return <span className="text-yellow-600">⚠ {quantity} left</span>;
  if (status === "near_expiry")
    return <span className="text-orange-600">⚠ {quantity} · Near expiry</span>;
  return <span className="text-green-600">✓ {quantity}</span>;
}

export function POSProductCard({
  item,
  stockStatus,
  onAddToCart,
}: POSProductCardProps) {
  const isDisabled =
    stockStatus === "out_of_stock" || stockStatus === "expired";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-colors ${
        isDisabled ? "opacity-50" : "hover:bg-accent/30 cursor-pointer"
      }`}
      onClick={isDisabled ? undefined : onAddToCart}
    >
      {/* Left: name + meta in a single compact row stack */}
      <div className="flex flex-col min-w-0 flex-1 gap-0">
        {/* Row 1: product name + Rx badge */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-sm leading-snug truncate">
            {item.productName}
          </span>
          {item.requiresPrescription && (
            <Badge
              variant="outline"
              className="text-xs px-1 h-4 shrink-0 border-blue-400 text-blue-600"
            >
              Rx
            </Badge>
          )}
        </div>

        {/* Row 2: generic name · packaging · sku · stock — all on one line */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0 flex-wrap">
          {item.productGenericName && (
            <span className="truncate">{item.productGenericName}</span>
          )}
          {item.packagingLabel && (
            <>
              {item.productGenericName && <span>·</span>}
              <span className="shrink-0">{item.packagingLabel}</span>
            </>
          )}
          {item.productSku && (
            <>
              <span>·</span>
              <span className="font-mono shrink-0">{item.productSku}</span>
            </>
          )}
          <span>·</span>
          <span className="shrink-0 font-medium">
            <StockIndicator status={stockStatus} quantity={item.quantity} />
          </span>
        </div>
      </div>

      {/* Right: price + add button inline */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-sm tabular-nums">
          ₱{item.sellingPrice.toFixed(2)}
        </span>
        <Button
          size="sm"
          disabled={isDisabled}
          className="h-7 px-2 gap-1"
          onClick={e => {
            e.stopPropagation();
            if (!isDisabled) onAddToCart();
          }}
        >
          <PlusIcon className="size-3" />
          Add
        </Button>
      </div>
    </div>
  );
}
