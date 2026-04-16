'use client'

import { useState, useMemo, useTransition, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { EllipsisVerticalIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AppUser, UserRole } from '@/types/user'
import { ROLE_LABELS } from '@/types/user'
import { AddUserModal } from './AddUserModal'
import { EditUserModal } from './EditUserModal'
import { ResetPasswordDialog } from './ResetPasswordDialog'
import { DeactivateUserDialog } from './DeactivateUserDialog'
import { ReactivateUserDialog } from './ReactivateUserDialog'

const ROLE_FILTER_LABELS: Record<string, string> = {
  all: 'All Roles',
  admin: 'Administrator',
  pharmacist: 'Pharmacist',
  pharmacy_assistant: 'Pharmacy Assistant',
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'admin') return <Badge variant="default">Administrator</Badge>
  if (role === 'pharmacist') return <Badge variant="secondary">Pharmacist</Badge>
  return <Badge variant="outline">Pharmacy Asst</Badge>
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) return <Badge variant="default">Active</Badge>
  return <Badge variant="destructive">Inactive</Badge>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

type UsersTableProps = {
  users: AppUser[]
  pharmacies: { id: string; name: string }[]
  currentSearch: string
  currentRole: string
  showInactive: boolean
  currentUserId: string
}

export function UsersTable({
  users,
  pharmacies,
  currentSearch,
  currentRole,
  showInactive,
  currentUserId,
}: UsersTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(currentSearch)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [searchParams, pathname, router],
  )

  const handleSearch = useDebouncedCallback((value: string) => {
    updateParams({ search: value || null })
  }, 400)

  const columns = useMemo<ColumnDef<AppUser>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue('name')}</span>
        ),
      },
      {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.getValue('username')}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => <RoleBadge role={row.getValue('role') as UserRole} />,
      },
      {
        id: 'pharmacy',
        header: 'Pharmacy',
        cell: ({ row }) => {
          const pharmacyName = row.original.pharmacies?.name
          if (pharmacyName) return <span>{pharmacyName}</span>
          return (
            <span className="text-muted-foreground italic">Global</span>
          )
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge isActive={row.original.is_active} />,
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => formatDate(row.getValue('created_at')),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const user = row.original
          const isOwnRow = user.id === currentUserId
          return (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                <EllipsisVerticalIcon className="size-4" />
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUser(user)
                    setEditOpen(true)
                  }}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUser(user)
                    setResetOpen(true)
                  }}
                >
                  Reset Password
                </DropdownMenuItem>
                {user.is_active && !isOwnRow && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setSelectedUser(user)
                        setDeactivateOpen(true)
                      }}
                    >
                      Deactivate
                    </DropdownMenuItem>
                  </>
                )}
                {!user.is_active && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedUser(user)
                        setReactivateOpen(true)
                      }}
                    >
                      Reactivate
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [currentUserId],
  )

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              handleSearch(e.target.value)
            }}
            className="w-64"
          />
          <Select
            value={currentRole}
            onValueChange={(value: string | null) => {
              if (!value) return
              updateParams({ role: value === 'all' ? null : value })
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Roles">
                {ROLE_FILTER_LABELS[currentRole] ?? 'All Roles'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="pharmacist">Pharmacist</SelectItem>
              <SelectItem value="pharmacy_assistant">Pharmacy Assistant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showInactive ? 'default' : 'outline'}
            onClick={() =>
              updateParams({ inactive: showInactive ? null : 'true' })
            }
          >
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddUserModal
        open={addOpen}
        onOpenChange={setAddOpen}
        pharmacies={pharmacies}
      />
      <EditUserModal
        open={editOpen}
        onOpenChange={setEditOpen}
        user={selectedUser}
        pharmacies={pharmacies}
        currentUserId={currentUserId}
      />
      <ResetPasswordDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        userId={selectedUser?.id ?? null}
        authId={selectedUser?.auth_id ?? null}
        userName={selectedUser?.name ?? ''}
      />
      <DeactivateUserDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        userId={selectedUser?.id ?? null}
        authId={selectedUser?.auth_id ?? null}
        userName={selectedUser?.name ?? ''}
      />
      <ReactivateUserDialog
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        userId={selectedUser?.id ?? null}
        authId={selectedUser?.auth_id ?? null}
        userName={selectedUser?.name ?? ''}
      />
    </>
  )
}
