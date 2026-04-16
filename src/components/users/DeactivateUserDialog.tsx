'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { deactivateUser } from '@/app/admin/users/actions'
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

export function DeactivateUserDialog({
  open,
  onOpenChange,
  userId,
  authId,
  userName,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const handleDeactivate = () => {
    if (!userId || !authId) return
    startTransition(async () => {
      try {
        await deactivateUser(userId, authId)
        toast.success(`${userName} has been deactivated.`)
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to deactivate user.')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate{' '}
            <span className="font-medium text-foreground">{userName}</span>?
            They will immediately lose access to the system. You can reactivate
            them at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault()
              handleDeactivate()
            }}
            disabled={isPending}
          >
            {isPending ? 'Deactivating…' : 'Deactivate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
