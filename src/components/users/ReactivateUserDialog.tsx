'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { reactivateUser } from '@/app/admin/users/actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  authId: string | null
  userName: string
}

export function ReactivateUserDialog({
  open,
  onOpenChange,
  userId,
  authId,
  userName,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const handleReactivate = () => {
    if (!userId || !authId) return
    startTransition(async () => {
      try {
        await reactivateUser(userId, authId)
        toast.success(`${userName} has been reactivated.`)
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reactivate user.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reactivate User</AlertDialogTitle>
          <AlertDialogDescription>
            Reactivate{' '}
            <span className="font-medium text-foreground">{userName}</span>?
            They will regain access to the system immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleReactivate()
            }}
            disabled={isPending}
          >
            {isPending ? 'Reactivating…' : 'Reactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
