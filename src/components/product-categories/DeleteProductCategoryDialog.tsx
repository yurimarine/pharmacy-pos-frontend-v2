"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { deleteProductCategory } from "@/app/admin/product-categories/actions"
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
  categoryId: string | null
  categoryName: string
}

export function DeleteProductCategoryDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!categoryId) return

    startTransition(async () => {
      try {
        await deleteProductCategory(categoryId)
        toast.success("Category deleted.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to delete category.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{categoryName}</span>?
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
