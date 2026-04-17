import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StockStatus } from '@/types/inventory'

type POSProductCardProps = {
  productName: string
  genericName: string | null
  sku: string | null
  sellingPrice: number
  quantity: number
  stockStatus: StockStatus
  requiresPrescription: boolean
}

const STOCK_STATUS_CONFIG: Record<
  StockStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  in_stock: { label: 'In Stock', variant: 'default' },
  low_stock: { label: 'Low Stock', variant: 'secondary' },
  out_of_stock: { label: 'Out of Stock', variant: 'destructive' },
  near_expiry: { label: 'Near Expiry', variant: 'outline' },
  expired: { label: 'Expired', variant: 'destructive' },
}

export function POSProductCard({
  productName,
  genericName,
  sku,
  sellingPrice,
  quantity,
  stockStatus,
  requiresPrescription,
}: POSProductCardProps) {
  const config = STOCK_STATUS_CONFIG[stockStatus]
  const isDisabled = stockStatus === 'out_of_stock' || stockStatus === 'expired'

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3 gap-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-sm leading-tight truncate">
            {productName}
          </span>
          {requiresPrescription && (
            <Badge variant="outline" className="text-xs shrink-0">
              Rx
            </Badge>
          )}
        </div>
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
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={config.variant} className="text-xs">
            {config.label}
          </Badge>
          {!isDisabled && (
            <span className="text-xs text-muted-foreground">
              {quantity} left
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="font-semibold text-sm">
          ₱{sellingPrice.toFixed(2)}
        </span>
        <Button
          size="sm"
          disabled={isDisabled}
          className="gap-1"
        >
          <PlusIcon className="size-3" />
          Add
        </Button>
      </div>
    </div>
  )
}
