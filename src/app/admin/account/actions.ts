"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/get-current-user"

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ error: string } | undefined> {
  const currentUser = await getCurrentUser()

  if (currentUser.role === "pharmacy_assistant") {
    return { error: "Unauthorized" }
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." }
  }

  const supabase = await createClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: currentUser.email,
    password: currentPassword,
  })
  if (signInError) {
    return { error: "Current password is incorrect." }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (updateError) {
    return { error: "Failed to update password. Please try again." }
  }

  return undefined
}
