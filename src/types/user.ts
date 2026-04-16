export type UserRole = 'admin' | 'pharmacist' | 'pharmacy_assistant'

export type UserStatus = 'active' | 'inactive'

export type AppUser = {
  id: string
  auth_id: string
  name: string
  username: string
  email: string
  role: UserRole
  pharmacy_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  pharmacies?: { name: string } | null
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  pharmacist: 'Pharmacist',
  pharmacy_assistant: 'Pharmacy Assistant',
}
