'use client'

import { useEffect, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { updateUser } from '@/app/admin/users/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AppUser, UserRole } from '@/types/user'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  pharmacist: 'Pharmacist',
  pharmacy_assistant: 'Pharmacy Assistant',
}

const editUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    username: z
      .string()
      .min(1, 'Username is required')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
    role: z.enum(['admin', 'pharmacist', 'pharmacy_assistant']),
    pharmacy_id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== 'admin' && !data.pharmacy_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pharmacy is required for this role',
        path: ['pharmacy_id'],
      })
    }
  })

type FormValues = z.infer<typeof editUserSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AppUser | null
  pharmacies: { id: string; name: string }[]
  currentUserId: string
}

export function EditUserModal({
  open,
  onOpenChange,
  user,
  pharmacies,
  currentUserId,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const isOwnAccount = user?.id === currentUserId

  const form = useForm<FormValues>({
    resolver: zodResolver(editUserSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      name: '',
      username: '',
      role: 'pharmacist',
      pharmacy_id: '',
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        username: user.username,
        role: user.role,
        pharmacy_id: user.pharmacy_id ?? '',
      })
    }
  }, [user, form])

  const watchedRole = form.watch('role')
  const showPharmacy = watchedRole !== 'admin'

  const handleRoleChange = (value: string | null) => {
    if (!value) return
    form.setValue('role', value as UserRole)
    if (value === 'admin') {
      form.setValue('pharmacy_id', '')
    }
  }

  const onSubmit = (values: FormValues) => {
    if (!user) return
    startTransition(async () => {
      try {
        await updateUser(user.id, {
          ...values,
          pharmacy_id: values.role === 'admin' ? undefined : values.pharmacy_id,
        })
        toast.success('User updated.')
        onOpenChange(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update user.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <form id="edit-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input id="edit-username" {...form.register('username')} />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              {isOwnAccount ? (
                <p className="text-sm text-muted-foreground">
                  You cannot change your own role.
                </p>
              ) : (
                <Controller
                  name="role"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={handleRoleChange}
                      disabled={isOwnAccount}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role">
                          {ROLE_LABELS[field.value as UserRole]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                        <SelectItem value="pharmacy_assistant">
                          Pharmacy Assistant
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {form.formState.errors.role && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.role.message}
                </p>
              )}
            </div>

            {showPharmacy && (
              <div className="space-y-2">
                <Label>Pharmacy</Label>
                <Controller
                  name="pharmacy_id"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(value: string | null) => {
                        if (value) field.onChange(value)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pharmacy">
                          {pharmacies.find((p) => p.id === field.value)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {pharmacies.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
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
            )}
          </form>
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="edit-user-form" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
