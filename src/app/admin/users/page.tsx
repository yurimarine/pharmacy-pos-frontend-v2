import { getCurrentUser } from '@/lib/get-current-user'
import { getUsers, getPharmaciesForUserForm } from './actions'
import { UsersTable } from '@/components/users/UsersTable'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    role?: string
    inactive?: string
  }>
}) {
  const params = await searchParams
  const search = params.search
  const role = params.role
  const showInactive = params.inactive === 'true'

  const [users, pharmacies, currentUser] = await Promise.all([
    getUsers(search, role, showInactive),
    getPharmaciesForUserForm(),
    getCurrentUser(),
  ])

  return (
    <div className="px-4 lg:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage system user accounts and roles
        </p>
      </div>
      <UsersTable
        users={users}
        pharmacies={pharmacies}
        currentSearch={search ?? ''}
        currentRole={role ?? 'all'}
        showInactive={showInactive}
        currentUserId={currentUser.id}
      />
    </div>
  )
}
