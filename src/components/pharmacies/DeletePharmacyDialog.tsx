"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { deletePharmacy } from "@/app/admin/pharmacies/actions"
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

type DeletePharmacyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pharmacyId: string | null
  pharmacyName: string
}

export function DeletePharmacyDialog({
  open,
  onOpenChange,
  pharmacyId,
  pharmacyName,
}: DeletePharmacyDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!pharmacyId) return

    startTransition(async () => {
      try {
        await deletePharmacy(pharmacyId)
        toast.success("Pharmacy deleted successfully.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to delete pharmacy.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Pharmacy</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{pharmacyName}</span>?
            This action cannot be undone.
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
