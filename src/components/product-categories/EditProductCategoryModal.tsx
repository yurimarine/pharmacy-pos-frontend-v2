"use client"

import { useEffect, useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { updateProductCategory } from "@/app/admin/product-categories/actions"
import type { ProductCategory } from "@/types/reference-data"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  class_id: z.string().min(1, "Class is required"),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: ProductCategory | null
  classes: { id: string; name: string }[]
}

export function EditProductCategoryModal({
  open,
  onOpenChange,
  category,
  classes,
}: Props) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", class_id: "" },
  })

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description ?? "",
        class_id: category.class_id,
      })
    }
  }, [category, form])

  const onSubmit = (data: FormValues) => {
    if (!category) return

    startTransition(async () => {
      try {
        await updateProductCategory(category.id, data)
        toast.success("Category updated.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to update category.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Product Category</DialogTitle>
          <DialogDescription>
            Update the details of this product category.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Class */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Class <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a class…">
                      {classes.find((c) => c.id === field.value)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No classes found.
                      </p>
                    ) : (
                      classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.class_id && (
              <p className="text-sm text-destructive">
                {form.formState.errors.class_id.message}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-category-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-category-name"
              placeholder="e.g. Analgesics"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-category-description">Description</Label>
            <Textarea
              id="edit-category-description"
              placeholder="Optional description…"
              rows={3}
              {...form.register("description")}
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
