"use client"

import { useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { updatePackagingUnit } from "@/app/admin/packaging-units/actions"
import type { PackagingUnit } from "@/types/reference-data"
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

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  abbreviation: z
    .string()
    .min(1, "Abbreviation is required")
    .max(6, "Abbreviation must be 6 characters or less"),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: PackagingUnit | null
}

export function EditPackagingUnitModal({ open, onOpenChange, unit }: Props) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", abbreviation: "" },
  })

  useEffect(() => {
    if (unit) {
      form.reset({ name: unit.name, abbreviation: unit.abbreviation })
    }
  }, [unit, form])

  const onSubmit = (data: FormValues) => {
    if (!unit) return

    startTransition(async () => {
      try {
        await updatePackagingUnit(unit.id, data)
        toast.success("Unit updated.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to update unit.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Packaging Unit</DialogTitle>
          <DialogDescription>
            Update the details of this packaging unit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-pkg-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-pkg-name"
              placeholder="e.g. Box"
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
            <Label htmlFor="edit-pkg-abbreviation">
              Abbreviation <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-pkg-abbreviation"
              placeholder="e.g. box"
              maxLength={6}
              aria-invalid={!!form.formState.errors.abbreviation}
              {...form.register("abbreviation")}
            />
            <p className="text-xs text-muted-foreground">
              Keep it short, e.g. box, btl, str
            </p>
            {form.formState.errors.abbreviation && (
              <p className="text-sm text-destructive">
                {form.formState.errors.abbreviation.message}
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
