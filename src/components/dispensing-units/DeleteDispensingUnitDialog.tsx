"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { deleteDispensingUnit } from "@/app/admin/dispensing-units/actions"
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  unitId: string | null
  unitName: string
}

export function DeleteDispensingUnitDialog({
  open,
  onOpenChange,
  unitId,
  unitName,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!unitId) return

    startTransition(async () => {
      try {
        await deleteDispensingUnit(unitId)
        toast.success("Unit deleted.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to delete unit.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Dispensing Unit</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{unitName}</span>?
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
