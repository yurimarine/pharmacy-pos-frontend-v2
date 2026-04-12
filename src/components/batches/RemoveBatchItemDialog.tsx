"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { removeBatchItem } from "@/app/admin/batches/actions"
import type { BatchItem } from "@/types/batch"
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

type RemoveBatchItemDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: BatchItem | null
  onRemoved: (itemId: string) => void
}

export function RemoveBatchItemDialog({
  open,
  onOpenChange,
  item,
  onRemoved,
}: RemoveBatchItemDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleRemove = () => {
    if (!item) return

    startTransition(async () => {
      try {
        await removeBatchItem(item.id, item.batch_id)
        toast.success("Item removed from batch.")
        onRemoved(item.id)
        onOpenChange(false)
      } catch {
        toast.error("Failed to remove item.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Item</AlertDialogTitle>
          <AlertDialogDescription>
            Remove{" "}
            <span className="font-medium text-foreground">
              {item?.products?.name}
            </span>{" "}
            from this batch? This will not affect current inventory.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Go Back</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault()
              handleRemove()
            }}
            disabled={isPending}
          >
            {isPending ? "Removing…" : "Remove Item"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
