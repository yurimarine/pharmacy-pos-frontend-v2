"use client"

import { useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createBatch } from "@/app/admin/batches/actions"
import type { Batch } from "@/types/batch"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const createBatchSchema = z.object({
  type: z.enum(["stock_in", "stock_out", "price_change"]),
  pharmacy_id: z.string().min(1, "Pharmacy is required"),
  notes: z.string().optional(),
})

type CreateBatchFormValues = z.infer<typeof createBatchSchema>

type CreateBatchModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pharmacies: { id: string; name: string }[]
  onCreated: (batch: Batch) => void
}

export function CreateBatchModal({
  open,
  onOpenChange,
  pharmacies,
  onCreated,
}: CreateBatchModalProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateBatchFormValues>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      type: "stock_in",
      pharmacy_id: "",
      notes: "",
    },
  })

  const onSubmit = (data: CreateBatchFormValues) => {
    startTransition(async () => {
      try {
        const result = await createBatch({
          type: data.type,
          pharmacy_id: data.pharmacy_id,
          notes: data.notes,
        })
        toast.success(`Batch ${result.batch_number} created.`)
        form.reset()
        onCreated(result)
      } catch {
        toast.error("Failed to create batch.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Batch</DialogTitle>
          <DialogDescription>
            Select the batch type and pharmacy to begin.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Type <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock_in">
                      Stock In — receiving products
                    </SelectItem>
                    <SelectItem value="stock_out">
                      Stock Out — removing products
                    </SelectItem>
                    <SelectItem value="price_change">
                      Price Change — update base prices
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.type && (
              <p className="text-sm text-destructive">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          {/* Pharmacy */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Pharmacy <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="pharmacy_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select pharmacy" />
                  </SelectTrigger>
                  <SelectContent>
                    {pharmacies.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No pharmacies found.
                      </p>
                    ) : (
                      pharmacies.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.pharmacy_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.pharmacy_id.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="batch-notes">Notes</Label>
            <Textarea
              id="batch-notes"
              placeholder="Optional remarks..."
              {...form.register("notes")}
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
              {isPending ? "Creating…" : "Create & Continue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
