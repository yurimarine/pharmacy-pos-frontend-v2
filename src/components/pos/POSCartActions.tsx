"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePOS } from "@/context/POSContext";
import { processTransaction } from "@/app/pos-terminal/actions";
import type { Transaction } from "@/types/transaction";
import type { CartItem } from "@/types/cart";
import { POSReceiptModal } from "./POSReceiptModal";

type POSCartActionsProps = {
  pharmacyId: string;
  amountTendered: number;
  onSaleComplete: () => void;
};

export function POSCartActions({
  pharmacyId,
  amountTendered,
  onSaleComplete,
}: POSCartActionsProps) {
  const { cartItems, totalAmount, clearCart } = usePOS();
  const [isPending, startTransition] = useTransition();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] =
    useState<Transaction | null>(null);
  const [receiptItems, setReceiptItems] = useState<CartItem[]>([]);

  const isCartEmpty = cartItems.length === 0;
  const isInsufficient = amountTendered < totalAmount || amountTendered === 0;
  const isDisabled = isCartEmpty || isInsufficient || isPending;

  const handleProcessSale = () => {
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
        onSaleComplete();
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
    <div className="flex gap-2 pt-3">
      <Button
        variant="outline"
        size="sm"
        className=" gap-1.5 text-destructive hover:text-destructive"
        disabled={isCartEmpty || isPending}
        onClick={clearCart}
      >
        <Trash2Icon className="size-3.5" />
        Clear Cart
      </Button>

      <Button
        className="text-base font-bold"
        size="sm"
        disabled={isDisabled}
        onClick={handleProcessSale}
      >
        {isPending ? "Processing..." : "PROCESS SALE"}
      </Button>

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
    </div>
  );
}
