"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { deleteProductClass } from "@/app/admin/product-classes/actions"
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
  classId: string | null
  className: string
}

export function DeleteProductClassDialog({
  open,
  onOpenChange,
  classId,
  className,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!classId) return

    startTransition(async () => {
      try {
        await deleteProductClass(classId)
        toast.success("Class deleted.")
        onOpenChange(false)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to delete class.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product Class</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{className}</span>?
            This cannot be undone. Classes with existing categories cannot be
            deleted.
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
