"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { deactivateInventoryEntry } from "@/app/admin/inventory/actions"
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

type DeactivateInventoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryId: string | null
  productName: string
}

export function DeactivateInventoryDialog({
  open,
  onOpenChange,
  entryId,
  productName,
}: DeactivateInventoryDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleDeactivate = () => {
    if (!entryId) return

    startTransition(async () => {
      try {
        await deactivateInventoryEntry(entryId)
        toast.success("Inventory entry removed.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to remove entry.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Inventory Entry</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">{productName}</span>{" "}
            from this pharmacy&apos;s inventory? Stock data will be preserved
            but this entry will no longer appear in the active inventory list.
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
            {isPending ? "Removing…" : "Remove Entry"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
