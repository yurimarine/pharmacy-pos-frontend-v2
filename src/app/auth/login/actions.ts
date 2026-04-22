"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function loginAction(data: {
  email: string
  password: string
}): Promise<{ error: string } | undefined> {
  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { error: error.message }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", authData.user.id)
    .single()

  if (userData?.role === "pharmacy_assistant") {
    redirect("/pos-terminal")
  }

  redirect("/admin/dashboard")
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
