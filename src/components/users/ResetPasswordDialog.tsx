'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { resetPassword } from '@/app/admin/users/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'At least one uppercase letter')
      .regex(/[a-z]/, 'At least one lowercase letter')
      .regex(/[0-9]/, 'At least one number')
      .regex(/[^A-Za-z0-9]/, 'At least one special character'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type FormValues = z.infer<typeof resetSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  authId: string | null
  userName: string
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  authId,
  userName,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(resetSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: { password: '', confirm_password: '' },
  })

  const onSubmit = (values: FormValues) => {
    if (!authId) return
    startTransition(async () => {
      try {
        await resetPassword(authId, values.password)
        toast.success(`Password reset for ${userName}.`)
        onOpenChange(false)
        form.reset()
      } catch {
        toast.error('Failed to reset password.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {userName}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <form
            id="reset-password-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password')}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  {...form.register('confirm_password')}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.confirm_password.message}
                </p>
              )}
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
          <Button type="submit" form="reset-password-form" disabled={isPending}>
            {isPending ? 'Resetting…' : 'Reset Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
