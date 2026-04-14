"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createDispensingUnit } from "@/app/admin/dispensing-units/actions"
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
}

export function AddDispensingUnitModal({ open, onOpenChange }: Props) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", abbreviation: "" },
  })

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        await createDispensingUnit(data)
        toast.success("Unit added.")
        onOpenChange(false)
        form.reset()
      } catch {
        toast.error("Failed to add unit.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Dispensing Unit</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new dispensing unit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-disp-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="add-disp-name"
              placeholder="e.g. Tablet"
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
            <Label htmlFor="add-disp-abbreviation">
              Abbreviation <span className="text-destructive">*</span>
            </Label>
            <Input
              id="add-disp-abbreviation"
              placeholder="e.g. tab"
              maxLength={6}
              aria-invalid={!!form.formState.errors.abbreviation}
              {...form.register("abbreviation")}
            />
            <p className="text-xs text-muted-foreground">
              Keep it short, e.g. tab, cap, mg
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
              {isPending ? "Saving…" : "Add Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
