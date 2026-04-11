"use client"

import { useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { updateSupplier } from "@/app/admin/suppliers/actions"
import type { Supplier } from "@/types/supplier"
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

type EditSupplierModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
}

export function EditSupplierModal({
  open,
  onOpenChange,
  supplier,
}: EditSupplierModalProps) {
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

  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        contact_person: supplier.contact_person ?? "",
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
      })
    }
  }, [supplier, form])

  const onSubmit = (data: SupplierFormValues) => {
    if (!supplier) return

    startTransition(async () => {
      try {
        await updateSupplier(supplier.id, {
          name: data.name,
          contact_person: data.contact_person || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
        })
        toast.success("Supplier updated successfully.")
        onOpenChange(false)
      } catch {
        toast.error("Failed to update supplier.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
          <DialogDescription>
            Update the details of this supplier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-supplier-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-supplier-name"
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
            <Label htmlFor="edit-supplier-contact">Contact Person</Label>
            <Input
              id="edit-supplier-contact"
              placeholder="e.g. Juan dela Cruz"
              {...form.register("contact_person")}
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-supplier-phone">Phone</Label>
            <Input
              id="edit-supplier-phone"
              placeholder="e.g. 09171234567"
              {...form.register("phone")}
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-supplier-email">Email</Label>
            <Input
              id="edit-supplier-email"
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
            <Label htmlFor="edit-supplier-address">Address</Label>
            <Textarea
              id="edit-supplier-address"
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
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
