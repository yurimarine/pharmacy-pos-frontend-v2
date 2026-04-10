/**
 * Seed script: creates the initial admin user in Supabase Auth.
 * The `on_auth_user_created` trigger will auto-insert into public.users.
 *
 * Usage:
 *   1. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local
 *   2. Run: npx tsx scripts/seed-admin.ts
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { createClient } from "@supabase/supabase-js"

// Load .env.local (tsx doesn't auto-load it like Next.js does)
try {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8")
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = val
  }
} catch {
  // no .env.local, rely on existing env
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  console.log("Creating admin user…")

  const { data, error } = await supabase.auth.admin.createUser({
    email: "admin@pharmacy.com",
    password: "Admin@1234",
    email_confirm: true,
    app_metadata: {
      username: "admin01",
      name: "Admin User",
      role: "admin",
    },
  })

  if (error) {
    console.error("Failed to create user:", error.message)
    process.exit(1)
  }

  console.log("Admin user created:", data.user?.id)
  console.log("Email: admin@pharmacy.com")
  console.log("Password: Admin@1234")
}

seed()
