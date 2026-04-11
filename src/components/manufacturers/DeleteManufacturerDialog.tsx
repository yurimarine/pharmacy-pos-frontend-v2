"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { deleteManufacturer } from "@/app/admin/manufacturers/actions"
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

type DeleteManufacturerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  manufacturerId: string | null
  manufacturerName: string
}

export function DeleteManufacturerDialog({
  open,
  onOpenChange,
  manufacturerId,
  manufacturerName,
}: DeleteManufacturerDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!manufacturerId) return

    startTransition(async () => {
      try {
        await deleteManufacturer(manufacturerId)
        toast.success("Manufacturer deleted successfully.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to delete manufacturer.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Manufacturer</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {manufacturerName}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
