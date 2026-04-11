"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createPharmacy } from "@/app/admin/pharmacies/actions"
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

type AddPharmacyModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPharmacyModal({ open, onOpenChange }: AddPharmacyModalProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<PharmacyFormValues>({
    resolver: zodResolver(pharmacySchema),
    defaultValues: { name: "", address: "", owner: "" },
  })

  const onSubmit = (data: PharmacyFormValues) => {
    startTransition(async () => {
      try {
        await createPharmacy({
          name: data.name,
          address: data.address || null,
          owner: data.owner || null,
        })
        toast.success("Pharmacy added successfully.")
        onOpenChange(false)
        form.reset()
      } catch {
        toast.error("Failed to add pharmacy.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Pharmacy</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new pharmacy.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pharmacy-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pharmacy-name"
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
            <Label htmlFor="pharmacy-address">Address</Label>
            <Textarea
              id="pharmacy-address"
              placeholder="e.g. 123 Rizal St, Manila"
              {...form.register("address")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pharmacy-owner">Owner</Label>
            <Input
              id="pharmacy-owner"
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
              {isPending ? "Saving…" : "Save Pharmacy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
