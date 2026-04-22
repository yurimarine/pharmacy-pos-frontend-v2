'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { voidTransaction } from '@/app/admin/transactions/actions'

const voidSchema = z.object({
  adminEmail: z.string().email('Valid email required'),
  adminPassword: z.string().min(1, 'Password is required'),
  voidReason: z
    .string()
    .min(10, 'Please provide a detailed reason (min 10 chars)'),
})

type VoidTransactionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionId: string
  transactionNumber: string
  onVoided: () => void
}

export function VoidTransactionDialog({
  open,
  onOpenChange,
  transactionId,
  transactionNumber,
  onVoided,
}: VoidTransactionDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [voidReason, setVoidReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleClose = () => {
    if (isPending) return
    onOpenChange(false)
    // Reset form
    setAdminEmail('')
    setAdminPassword('')
    setVoidReason('')
    setErrors({})
    setShowPassword(false)
  }

  const handleSubmit = () => {
    const result = voidSchema.safeParse({ adminEmail, adminPassword, voidReason })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    startTransition(async () => {
      try {
        await voidTransaction({
          transactionId,
          adminEmail: result.data.adminEmail,
          adminPassword: result.data.adminPassword,
          voidReason: result.data.voidReason,
        })
        toast.success(`Transaction ${transactionNumber} has been voided.`)
        onVoided()
        onOpenChange(false)
        setAdminEmail('')
        setAdminPassword('')
        setVoidReason('')
        setShowPassword(false)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to void transaction.'
        toast.error(message)
        // Do NOT close the dialog on error — let user retry
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Void Transaction</DialogTitle>
          <DialogDescription>Void {transactionNumber}</DialogDescription>
        </DialogHeader>

        {/* Warning */}
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          ⚠️ This action cannot be undone. Voiding will reverse all inventory
          deductions from this transaction. Administrator authorization is
          required.
        </div>

        <div className="flex flex-col gap-4">
          {/* Admin Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="void-admin-email">Administrator Email</Label>
            <Input
              id="void-admin-email"
              type="email"
              placeholder="Enter administrator email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              disabled={isPending}
              aria-invalid={!!errors.adminEmail}
            />
            {errors.adminEmail && (
              <p className="text-xs text-destructive">{errors.adminEmail}</p>
            )}
          </div>

          {/* Admin Password */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="void-admin-password">Administrator Password</Label>
            <div className="relative">
              <Input
                id="void-admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter administrator password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                disabled={isPending}
                className="pr-10"
                aria-invalid={!!errors.adminPassword}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-muted-foreground"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </Button>
            </div>
            {errors.adminPassword && (
              <p className="text-xs text-destructive">{errors.adminPassword}</p>
            )}
          </div>

          {/* Void Reason */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="void-reason">Void Reason</Label>
            <Textarea
              id="void-reason"
              placeholder="Explain why this transaction is being voided..."
              value={voidReason}
              onChange={e => setVoidReason(e.target.value)}
              disabled={isPending}
              className="min-h-20"
              aria-invalid={!!errors.voidReason}
            />
            {errors.voidReason && (
              <p className="text-xs text-destructive">{errors.voidReason}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? 'Voiding...' : 'Authorize & Void'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
