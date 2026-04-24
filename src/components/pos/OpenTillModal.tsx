'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { usePOS } from '@/context/POSContext'
import { openTillSession } from '@/app/pos-terminal/till-session-actions'
import {
  CASH_DENOMINATIONS,
  type CashBreakdown,
  computeCashTotal,
} from '@/types/till-session'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDenomLabel(denom: number): string {
  return `₱${denom.toLocaleString('en-PH')}`
}

export function OpenTillModal({ open, onOpenChange }: Props) {
  const { pharmacyId, setTillSession } = usePOS()
  const [breakdown, setBreakdown] = useState<Record<number, number>>({})
  const [openingNotes, setOpeningNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  const total = computeCashTotal(breakdown as CashBreakdown)

  function resetForm() {
    setBreakdown({})
    setOpeningNotes('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const newSession = await openTillSession({
          pharmacyId,
          openingCashBreakdown: breakdown as CashBreakdown,
          openingNotes: openingNotes.trim() || undefined,
        })
        setTillSession(newSession)
        toast.success('Till opened successfully. You can now process sales.')
        onOpenChange(false)
        resetForm()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to open till.'
        toast.error(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh] sm:max-w-lg">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Open Till</DialogTitle>
          <DialogDescription>
            Count the cash in the drawer to start your shift.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 space-y-4">
          <form id="open-till-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Cash Breakdown */}
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium">Cash Breakdown</Label>
                <p className="text-xs text-muted-foreground">
                  Count each denomination in the drawer.
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Denomination</TableHead>
                    <TableHead className="w-28">Count</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CASH_DENOMINATIONS.map((denom) => {
                    const count = breakdown[denom] ?? 0
                    const subtotal = denom * count
                    return (
                      <TableRow key={denom}>
                        <TableCell className="font-medium">
                          {formatDenomLabel(denom)}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={count === 0 ? '' : count}
                            placeholder="0"
                            className="h-8 w-24"
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10)
                              const clamped = isNaN(val) ? 0 : Math.max(0, val)
                              setBreakdown((prev) => ({ ...prev, [denom]: clamped }))
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPeso(subtotal)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t pt-3 px-1">
                <span className="text-sm font-bold">Total Opening Cash</span>
                <span className="text-sm font-bold tabular-nums">
                  {formatPeso(total)}
                </span>
              </div>
            </div>

            {/* Opening Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="opening-notes">Opening Notes</Label>
              <Textarea
                id="opening-notes"
                placeholder="Optional notes for this shift..."
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                rows={2}
              />
            </div>
          </form>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="open-till-form"
            disabled={isPending || total === 0}
          >
            {isPending ? 'Opening Till...' : 'Open Till'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
