"use client";

import { BanknoteIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type POSPaymentSectionProps = {
  totalAmount: number;
  amountTendered: number;
  onAmountTenderedChange: (amount: number) => void;
};

export function POSPaymentSection({
  totalAmount,
  amountTendered,
  onAmountTenderedChange,
}: POSPaymentSectionProps) {
  const change = amountTendered - totalAmount;
  const isInsufficient = amountTendered > 0 && amountTendered < totalAmount;

  return (
    <div className="flex flex-col gap-3 py-3 border-t">
      {/* Tendered */}
      <div className="flex flex-col gap-1">
        <Label
          htmlFor="amount-tendered"
          className="text-xs text-muted-foreground"
        >
          Amount Tendered
        </Label>
        <Input
          id="amount-tendered"
          type="number"
          min={0}
          step={0.01}
          value={amountTendered || ""}
          onChange={e =>
            onAmountTenderedChange(parseFloat(e.target.value) || 0)
          }
          className="text-center md:text-2xl font-mono"
          placeholder={`${totalAmount.toFixed(2)}`}
        />
      </div>

      {/* Change */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Change</span>
        {isInsufficient ? (
          <span className="font-semibold text-destructive text-xs">
            Insufficient amount
          </span>
        ) : (
          <span className="font-semibold font-mono text-green-600">
            ₱{Math.max(0, change).toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
