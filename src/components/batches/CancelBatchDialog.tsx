"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { cancelBatch } from "@/app/admin/batches/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type CancelBatchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  batchId: string | null
  batchNumber: string
  onCancelled: () => void
}

export function CancelBatchDialog({
  open,
  onOpenChange,
  batchId,
  batchNumber,
  onCancelled,
}: CancelBatchDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleCancel = () => {
    if (!batchId) return

    startTransition(async () => {
      try {
        await cancelBatch(batchId)
        toast.success("Batch cancelled.")
        onCancelled()
        onOpenChange(false)
      } catch {
        toast.error("Failed to cancel batch.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Batch</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel{" "}
            <span className="font-medium text-foreground">{batchNumber}</span>?
            All items in this batch will be discarded and no inventory changes
            will be applied.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Go Back</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault()
              handleCancel()
            }}
            disabled={isPending}
          >
            {isPending ? "Cancelling…" : "Cancel Batch"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
