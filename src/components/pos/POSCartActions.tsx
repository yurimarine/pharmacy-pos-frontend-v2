'use client'

import { Trash2Icon, PrinterIcon, CheckCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type POSCartActionsProps = {
  hasItems: boolean
  isValid: boolean
}

export function POSCartActions({ hasItems, isValid }: POSCartActionsProps) {
  return (
    <div className="flex flex-col gap-2 pt-3">
      <Button
        className="w-full gap-2"
        size="lg"
        disabled={!isValid}
      >
        <CheckCircleIcon className="size-4" />
        Process Transaction
      </Button>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          disabled={!hasItems}
        >
          <PrinterIcon className="size-3.5" />
          Print Receipt
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-destructive hover:text-destructive"
          disabled={!hasItems}
        >
          <Trash2Icon className="size-3.5" />
          Clear Cart
        </Button>
      </div>
    </div>
  )
}
