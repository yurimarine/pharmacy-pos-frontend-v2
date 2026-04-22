"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { usePOS } from "@/context/POSContext";
import { processTransaction } from "@/app/pos-terminal/actions";
import type { Transaction } from "@/types/transaction";
import type { CartItem } from "@/types/cart";
import { POSReceiptModal } from "./POSReceiptModal";

type POSPaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pharmacyId: string;
};

export function POSPaymentModal({
  open,
  onOpenChange,
  pharmacyId,
}: POSPaymentModalProps) {
  const { cartItems, itemCount, totalAmount, clearCart } = usePOS();
  const [amountTendered, setAmountTendered] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] =
    useState<Transaction | null>(null);
  const [receiptItems, setReceiptItems] = useState<CartItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset tendered amount when modal opens; autofocus input
  useEffect(() => {
    if (open) {
      setAmountTendered(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const change = amountTendered - totalAmount;
  const isInsufficient = amountTendered === 0 || amountTendered < totalAmount;

  const handleConfirm = () => {
    const itemSnapshot = [...cartItems];

    startTransition(async () => {
      try {
        const result = await processTransaction({
          cartItems: itemSnapshot,
          amountTendered,
          pharmacyId,
        });
        setCompletedTransaction(result);
        setReceiptItems(itemSnapshot);
        clearCart();
        onOpenChange(false);
        setReceiptOpen(true);
        toast.success("Sale processed successfully.");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to process sale.";
        toast.error(message);
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>

          {/* Order summary */}
          <div className="flex flex-col gap-2 rounded-lg bg-muted/40 px-4 py-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex justify-between items-center font-semibold text-4xl">
              <span className="text-sm">Total Due</span>
              <span>{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <Separator />

          {/* Amount tendered */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="modal-amount-tendered"
              className="text-xs text-muted-foreground"
            >
              Amount Tendered
            </Label>
            <Input
              ref={inputRef}
              id="modal-amount-tendered"
              type="number"
              min={0}
              step={0.01}
              value={amountTendered || ""}
              onChange={e => setAmountTendered(parseFloat(e.target.value) || 0)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !isInsufficient && !isPending) handleConfirm()
              }}
              className="h-auto text-center md:text-4xl font-mono"
              placeholder={totalAmount.toFixed(2)}
              disabled={isPending}
            />
          </div>

          {/* Change */}
          <div className="flex justify-between items-center text-2xl">
            <span className="text-muted-foreground">Change</span>
            {amountTendered > 0 && amountTendered < totalAmount ? (
              <span className="font-semibold text-destructive text-xs">
                Insufficient amount
              </span>
            ) : amountTendered >= totalAmount && amountTendered > 0 ? (
              <span className="font-semibold font-mono text-green-600">
                {change.toFixed(2)}
              </span>
            ) : (
              <span className="font-semibold font-mono text-muted-foreground">
                —
              </span>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 font-bold"
              disabled={isInsufficient || isPending}
              onClick={handleConfirm}
            >
              {isPending ? "Processing..." : "Confirm & Process"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <POSReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        transaction={completedTransaction}
        receiptItems={receiptItems}
        onNewTransaction={() => {
          setReceiptOpen(false);
          setCompletedTransaction(null);
          setReceiptItems([]);
        }}
      />
    </>
  );
}
