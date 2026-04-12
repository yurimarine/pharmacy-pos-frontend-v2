"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { deactivateProduct } from "@/app/admin/products/actions"
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

type DeactivateProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string | null
  productName: string
}

export function DeactivateProductDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: DeactivateProductDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleDeactivate = () => {
    if (!productId) return

    startTransition(async () => {
      try {
        await deactivateProduct(productId)
        toast.success("Product deactivated.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to deactivate product.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate{" "}
            <span className="font-medium text-foreground">{productName}</span>?
            This product will no longer appear in the catalog but its data and
            history will be preserved.
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
            {isPending ? "Deactivating…" : "Deactivate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
