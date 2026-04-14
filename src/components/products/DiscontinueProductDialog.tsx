"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { discontinueProduct } from "@/app/admin/products/actions"
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
  productId: string | null
  productName: string
}

export function DiscontinueProductDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const handleDiscontinue = () => {
    if (!productId) return

    startTransition(async () => {
      try {
        await discontinueProduct(productId)
        toast.success("Product discontinued.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to discontinue product.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discontinue Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to discontinue{" "}
            <span className="font-medium text-foreground">{productName}</span>?
            This product will be hidden from the catalog and POS. Its data and
            history will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault()
              handleDiscontinue()
            }}
            disabled={isPending}
          >
            {isPending ? "Discontinuing…" : "Discontinue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
