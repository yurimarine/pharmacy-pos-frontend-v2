'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, isAdmin } from '@/lib/get-current-user'
import { revalidatePath } from 'next/cache'
import type { AppUser, UserRole } from '@/types/user'

async function requireAdmin() {
  const currentUser = await getCurrentUser()
  if (!isAdmin(currentUser)) {
    throw new Error('Unauthorized: Admin access required')
  }
  return currentUser
}

export async function getUsers(
  search?: string,
  role?: string,
  showInactive?: boolean,
): Promise<AppUser[]> {
  const supabase = await createClient()
  let query = supabase
    .from('users')
    .select(`
      id, auth_id, name, username, email, role,
      pharmacy_id, is_active, created_at, updated_at,
      pharmacies ( name )
    `)
    .order('created_at', { ascending: false })

  if (!showInactive) {
    query = query.eq('is_active', true)
  }

  if (role && role !== 'all') {
    query = query.eq('role', role)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AppUser[]
}

export async function getUserById(id: string): Promise<AppUser> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, auth_id, name, username, email, role,
      pharmacy_id, is_active, created_at, updated_at,
      pharmacies ( name )
    `)
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as unknown as AppUser
}

export async function createUser(data: {
  name: string
  username: string
  email: string
  password: string
  role: UserRole
  pharmacy_id?: string
}): Promise<void> {
  await requireAdmin()

  const adminClient = createAdminClient()

  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    })

  if (authError) throw new Error(authError.message)
  const authUserId = authData.user.id

  const supabase = await createClient()
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      auth_id: authUserId,
      name: data.name,
      username: data.username,
      email: data.email,
      role: data.role,
      pharmacy_id: data.pharmacy_id ?? null,
      is_active: true,
    })

  if (insertError) {
    await adminClient.auth.admin.deleteUser(authUserId)
    throw new Error(insertError.message)
  }

  revalidatePath('/admin/users')
}

export async function updateUser(
  id: string,
  data: {
    name: string
    username: string
    role: UserRole
    pharmacy_id?: string
  },
): Promise<AppUser> {
  await requireAdmin()

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('users')
    .update({
      name: data.name,
      username: data.username,
      role: data.role,
      pharmacy_id: data.pharmacy_id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      id, auth_id, name, username, email, role,
      pharmacy_id, is_active, created_at, updated_at,
      pharmacies ( name )
    `)
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
  return row as unknown as AppUser
}

export async function resetPassword(
  authId: string,
  newPassword: string,
): Promise<void> {
  await requireAdmin()

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(authId, {
    password: newPassword,
  })

  if (error) throw new Error(error.message)
}

export async function deactivateUser(
  id: string,
  authId: string,
): Promise<void> {
  const currentUser = await requireAdmin()

  if (currentUser.id === id) {
    throw new Error('You cannot deactivate your own account.')
  }

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) throw new Error(updateError.message)

  const adminClient = createAdminClient()
  const { error: banError } = await adminClient.auth.admin.updateUserById(
    authId,
    { ban_duration: '876600h' },
  )

  if (banError) throw new Error(banError.message)
  revalidatePath('/admin/users')
}

export async function reactivateUser(
  id: string,
  authId: string,
): Promise<void> {
  await requireAdmin()

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from('users')
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) throw new Error(updateError.message)

  const adminClient = createAdminClient()
  const { error: unbanError } = await adminClient.auth.admin.updateUserById(
    authId,
    { ban_duration: 'none' },
  )

  if (unbanError) throw new Error(unbanError.message)
  revalidatePath('/admin/users')
}

export async function getPharmaciesForUserForm(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pharmacies')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
