'use client'

import { useState } from 'react'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { POSReceiptModal } from './POSReceiptModal'

type POSCartActionsProps = {
  hasItems: boolean
  isValid: boolean
}

export function POSCartActions({ hasItems, isValid }: POSCartActionsProps) {
  const [receiptOpen, setReceiptOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2 pt-3">
      <Button
        className="w-full h-12 text-base font-bold"
        size="lg"
        onClick={() => setReceiptOpen(true)}
      >
        PROCESS SALE
      </Button>

      <Button
        variant="outline"
        className="w-full gap-1.5 text-destructive hover:text-destructive"
        disabled={!hasItems}
      >
        <Trash2Icon className="size-3.5" />
        Clear Cart
      </Button>

      <POSReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </div>
  )
}
