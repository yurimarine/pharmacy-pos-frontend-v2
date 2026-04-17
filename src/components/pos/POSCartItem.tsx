import { Trash2Icon, MinusIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type POSCartItemProps = {
  productName: string
  genericName: string | null
  sku: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  maxQuantity: number
}

export function POSCartItem({
  productName,
  genericName,
  sku,
  quantity,
  unitPrice,
  totalPrice,
  maxQuantity,
}: POSCartItemProps) {
  return (
    <div className="flex flex-col gap-1.5 py-3 border-b last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium leading-tight truncate">
            {productName}
          </span>
          {genericName && (
            <span className="text-xs text-muted-foreground truncate">
              {genericName}
            </span>
          )}
          {sku && (
            <span className="font-mono text-xs text-muted-foreground">
              {sku}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
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
            disabled={quantity <= 1}
          >
            <MinusIcon className="size-3" />
          </Button>
          <Input
            className="w-12 h-7 text-center text-sm p-0"
            value={quantity}
            readOnly
          />
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            disabled={quantity >= maxQuantity}
          >
            <PlusIcon className="size-3" />
          </Button>
          <span className="text-xs text-muted-foreground">
            × ₱{unitPrice.toFixed(2)}
          </span>
        </div>

        {/* Line total */}
        <span className="font-semibold text-sm shrink-0">
          ₱{totalPrice.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
