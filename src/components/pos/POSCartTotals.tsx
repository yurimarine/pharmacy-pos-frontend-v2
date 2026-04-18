import { Separator } from "@/components/ui/separator";

type POSCartTotalsProps = {
  subtotal: number;
  totalAmount: number;
};

export function POSCartTotals({ subtotal, totalAmount }: POSCartTotalsProps) {
  return (
    <div className="flex flex-col gap-1.5 py-3 text-sm">
      <div className="flex justify-between text-muted-foreground">
        <span>Subtotal</span>
        <span>₱{subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Discount</span>
        <span>₱0.00</span>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold text-2xl">
        <span>Total</span>
        <span>₱{totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}
