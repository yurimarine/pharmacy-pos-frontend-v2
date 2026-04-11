"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createSupplier } from "@/app/admin/suppliers/actions"
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

const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
})

type SupplierFormValues = z.infer<typeof supplierSchema>

type AddSupplierModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSupplierModal({ open, onOpenChange }: AddSupplierModalProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
    },
  })

  const onSubmit = (data: SupplierFormValues) => {
    startTransition(async () => {
      try {
        await createSupplier({
          name: data.name,
          contact_person: data.contact_person || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
        })
        toast.success("Supplier added successfully.")
        onOpenChange(false)
        form.reset()
      } catch {
        toast.error("Failed to add supplier.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Supplier</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new supplier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="supplier-name"
              placeholder="e.g. MedSupply PH"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Contact Person */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-contact">Contact Person</Label>
            <Input
              id="supplier-contact"
              placeholder="e.g. Juan dela Cruz"
              {...form.register("contact_person")}
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-phone">Phone</Label>
            <Input
              id="supplier-phone"
              placeholder="e.g. 09171234567"
              {...form.register("phone")}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-email">Email</Label>
            <Input
              id="supplier-email"
              type="email"
              placeholder="e.g. supplier@example.com"
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplier-address">Address</Label>
            <Textarea
              id="supplier-address"
              placeholder="e.g. 123 Rizal St, Manila"
              {...form.register("address")}
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
              {isPending ? "Saving…" : "Save Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
