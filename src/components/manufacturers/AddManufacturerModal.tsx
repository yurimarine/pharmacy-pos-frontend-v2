"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createManufacturer } from "@/app/admin/manufacturers/actions"
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

type AddManufacturerModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddManufacturerModal({
  open,
  onOpenChange,
}: AddManufacturerModalProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<ManufacturerFormValues>({
    resolver: zodResolver(manufacturerSchema),
    defaultValues: { name: "" },
  })

  const onSubmit = (data: ManufacturerFormValues) => {
    startTransition(async () => {
      try {
        await createManufacturer(data)
        toast.success("Manufacturer added successfully.")
        onOpenChange(false)
        form.reset()
      } catch {
        toast.error("Failed to add manufacturer.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Manufacturer</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new manufacturer.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manufacturer-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="manufacturer-name"
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
              {isPending ? "Saving…" : "Save Manufacturer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
