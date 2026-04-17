'use client'

import { PrinterIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { POSReceipt } from './POSReceipt'

const mockReceipt = {
  transactionNumber: 'TXN-000001',
  pharmacy: 'MediCare Pharmacy',
  cashier: 'Juan dela Cruz',
  date: 'April 16, 2026',
  time: '2:34 PM',
  items: [
    {
      name: 'Biogesic 500mg',
      genericName: 'Paracetamol',
      quantity: 2,
      unitPrice: 10.2,
      totalPrice: 20.4,
    },
    {
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      quantity: 1,
      unitPrice: 14.4,
      totalPrice: 14.4,
    },
    {
      name: 'Cetirizine 10mg',
      genericName: 'Cetirizine HCl',
      quantity: 3,
      unitPrice: 4.0,
      totalPrice: 12.0,
    },
  ],
  subtotal: 46.8,
  discountAmount: 0.0,
  totalAmount: 46.8,
  amountTendered: 50.0,
  changeAmount: 3.2,
}

type POSReceiptModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function POSReceiptModal({ open, onOpenChange }: POSReceiptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm w-full p-0 overflow-hidden gap-0"
        showCloseButton={true}
      >
        {/* Scrollable receipt area */}
        <div className="max-h-[70vh] overflow-y-auto">
          <POSReceipt data={mockReceipt} />
        </div>

        {/* Action buttons outside the receipt paper */}
        <div className="flex gap-2 p-4 border-t bg-muted/30">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {}}
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            New Transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
