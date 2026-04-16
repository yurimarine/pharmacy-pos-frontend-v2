import { createClient } from "@/lib/supabase/server"

export type CurrentUser = {
  id: string
  auth_id: string
  name: string
  email: string
  role: "admin" | "pharmacist" | "pharmacy_assistant"
  pharmacy_id: string | null
  is_active: boolean
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, auth_id, name, email, role, pharmacy_id, is_active")
    .eq("auth_id", user.id)
    .single()

  if (error || !data) {
    throw new Error("User record not found")
  }

  if (!data.is_active) {
    throw new Error("Account is deactivated")
  }

  return data as CurrentUser
}

export function isAdmin(user: CurrentUser): boolean {
  return user.role === "admin"
}

export function isPharmacist(user: CurrentUser): boolean {
  return user.role === "pharmacist"
}

export function isPharmacyAssistant(user: CurrentUser): boolean {
  return user.role === "pharmacy_assistant"
}

export function hasPharmacyAccess(user: CurrentUser): boolean {
  return user.role === "pharmacist" || user.role === "pharmacy_assistant"
}
