'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { createUser } from '@/app/admin/users/actions'
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
import type { UserRole } from '@/types/user'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  pharmacist: 'Pharmacist',
  pharmacy_assistant: 'Pharmacy Assistant',
}

const addUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    username: z
      .string()
      .min(1, 'Username is required')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
    email: z.string().email('Valid email required'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'At least one uppercase letter')
      .regex(/[a-z]/, 'At least one lowercase letter')
      .regex(/[0-9]/, 'At least one number')
      .regex(/[^A-Za-z0-9]/, 'At least one special character'),
    role: z.enum(['admin', 'pharmacist', 'pharmacy_assistant']),
    pharmacy_id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== 'admin' && (!data.pharmacy_id || data.pharmacy_id === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pharmacy is required for this role',
        path: ['pharmacy_id'],
      })
    }
  })

type FormValues = z.infer<typeof addUserSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pharmacies: { id: string; name: string }[]
}

export function AddUserModal({ open, onOpenChange, pharmacies }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(addUserSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'pharmacist',
      pharmacy_id: '',
    },
  })

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
    startTransition(async () => {
      try {
        await createUser({
          ...values,
          pharmacy_id: values.role === 'admin' ? undefined : values.pharmacy_id,
        })
        toast.success('User created successfully.')
        onOpenChange(false)
        form.reset()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create user.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-1">
          <form id="add-user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Full name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...form.register('username')}
                placeholder="username"
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="user@example.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...form.register('password')}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={handleRoleChange}>
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
          <Button type="submit" form="add-user-form" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
