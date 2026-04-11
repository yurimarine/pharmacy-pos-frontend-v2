"use client"

import { useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { updatePharmacy } from "@/app/admin/pharmacies/actions"
import type { Pharmacy } from "@/types/pharmacy"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const pharmacySchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  owner: z.string().optional(),
})

type PharmacyFormValues = z.infer<typeof pharmacySchema>

type EditPharmacyModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pharmacy: Pharmacy | null
}

export function EditPharmacyModal({
  open,
  onOpenChange,
  pharmacy,
}: EditPharmacyModalProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<PharmacyFormValues>({
    resolver: zodResolver(pharmacySchema),
    defaultValues: { name: "", address: "", owner: "" },
  })

  useEffect(() => {
    if (pharmacy) {
      form.reset({
        name: pharmacy.name,
        address: pharmacy.address ?? "",
        owner: pharmacy.owner ?? "",
      })
    }
  }, [pharmacy, form])

  const onSubmit = (data: PharmacyFormValues) => {
    if (!pharmacy) return

    startTransition(async () => {
      try {
        await updatePharmacy(pharmacy.id, {
          name: data.name,
          address: data.address || null,
          owner: data.owner || null,
        })
        toast.success("Pharmacy updated successfully.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to update pharmacy.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pharmacy</DialogTitle>
          <DialogDescription>
            Update the details of this pharmacy.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-pharmacy-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-pharmacy-name"
              placeholder="e.g. MediCare Pharmacy"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-pharmacy-address">Address</Label>
            <Textarea
              id="edit-pharmacy-address"
              placeholder="e.g. 123 Rizal St, Manila"
              {...form.register("address")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-pharmacy-owner">Owner</Label>
            <Input
              id="edit-pharmacy-owner"
              placeholder="e.g. Jose Reyes"
              {...form.register("owner")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
