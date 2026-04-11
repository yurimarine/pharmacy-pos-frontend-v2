"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { deleteSupplier } from "@/app/admin/suppliers/actions"
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

type DeleteSupplierDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId: string | null
  supplierName: string
}

export function DeleteSupplierDialog({
  open,
  onOpenChange,
  supplierId,
  supplierName,
}: DeleteSupplierDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!supplierId) return

    startTransition(async () => {
      try {
        await deleteSupplier(supplierId)
        toast.success("Supplier deleted successfully.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to delete supplier.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{supplierName}</span>?
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
