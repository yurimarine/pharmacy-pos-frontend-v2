'use client'

import { useEffect } from 'react'
import { PrinterIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { usePOS } from '@/context/POSContext'
import type { Transaction } from '@/types/transaction'
import type { CartItem } from '@/types/cart'
import { formatDiscountLabel } from '@/types/discount'
import { POSReceipt } from './POSReceipt'

type POSReceiptModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  receiptItems: CartItem[]
  onNewTransaction: () => void
}

export function POSReceiptModal({
  open,
  onOpenChange,
  transaction,
  receiptItems,
  onNewTransaction,
}: POSReceiptModalProps) {
  const { pharmacyName, userName, activeDiscounts } = usePOS()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'F4') {
        e.preventDefault()
        onNewTransaction()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onNewTransaction])

  if (!transaction) return null

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

  const cartDiscountName = transaction.discount_id
    ? (activeDiscounts.find(d => d.id === transaction.discount_id)?.name ?? 'Discount')
    : null

  const receiptData = {
    transactionNumber: transaction.transaction_number,
    pharmacy: pharmacyName,
    cashier: userName,
    date,
    time,
    items: receiptItems.map(item => ({
      name: item.productName,
      genericName: item.productGenericName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      discountAmount: item.discountAmount,
      discountLabel: item.discount ? formatDiscountLabel(item.discount) : null,
    })),
    subtotal: transaction.subtotal ?? transaction.total_amount,
    discountId: transaction.discount_id,
    discountAmount: transaction.discount_amount ?? 0,
    discountName: cartDiscountName,
    referenceId: transaction.reference_id,
    referenceName: transaction.reference_name,
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
        {/* Scrollable receipt area */}
        <div className="max-h-[70vh] overflow-y-auto">
          <POSReceipt data={receiptData} />
        </div>

        {/* Action buttons outside the receipt paper */}
        <div className="flex gap-2 p-4 border-t bg-muted/30">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.print()}
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button className="flex-1" onClick={onNewTransaction}>
            New Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
