"use client"

import { useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { updateManufacturer } from "@/app/admin/manufacturers/actions"
import type { Manufacturer } from "@/types/manufacturer"
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

const manufacturerSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

type ManufacturerFormValues = z.infer<typeof manufacturerSchema>

type EditManufacturerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  manufacturer: Manufacturer | null
}

export function EditManufacturerModal({
  open,
  onOpenChange,
  manufacturer,
}: EditManufacturerModalProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<ManufacturerFormValues>({
    resolver: zodResolver(manufacturerSchema),
    defaultValues: { name: "" },
  })

  useEffect(() => {
    if (manufacturer) {
      form.reset({ name: manufacturer.name })
    }
  }, [manufacturer, form])

  const onSubmit = (data: ManufacturerFormValues) => {
    if (!manufacturer) return

    startTransition(async () => {
      try {
        await updateManufacturer(manufacturer.id, data)
        toast.success("Manufacturer updated successfully.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to update manufacturer.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Manufacturer</DialogTitle>
          <DialogDescription>
            Update the details of this manufacturer.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-manufacturer-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-manufacturer-name"
              placeholder="e.g. Pfizer Philippines"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
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
