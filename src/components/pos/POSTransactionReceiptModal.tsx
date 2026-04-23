'use client'

import { PrinterIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { POSReceipt } from './POSReceipt'
import type { TransactionWithItems } from '@/types/transaction'

type POSTransactionReceiptModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: TransactionWithItems | null
}

export function POSTransactionReceiptModal({
  open,
  onOpenChange,
  transaction,
}: POSTransactionReceiptModalProps) {
  if (!open) return null

  if (!transaction) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm w-full" showCloseButton={true}>
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading receipt...
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const createdAt = new Date(transaction.created_at)
  const date = createdAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const time = createdAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const receiptData = {
    transactionNumber: transaction.transaction_number,
    pharmacy: transaction.pharmacies?.name ?? '',
    cashier: transaction.users?.name ?? '',
    date,
    time,
    items: transaction.transaction_items.map(item => ({
      name: item.product_name,
      genericName: item.product_generic_name ?? null,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
    })),
    subtotal: transaction.subtotal,
    discountAmount: transaction.discount_amount,
    totalAmount: transaction.total_amount,
    amountTendered: transaction.amount_tendered,
    changeAmount: transaction.change_amount,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm w-full p-0 overflow-hidden gap-0"
        showCloseButton={true}
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <POSReceipt data={receiptData} />
        </div>

        <div className="flex gap-2 p-4 border-t bg-muted/30">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => window.print()}
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
