import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-current-user"
import { AccountSettingsLayout } from "@/components/account/AccountSettingsLayout"

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>
}) {
  let currentUser
  try {
    currentUser = await getCurrentUser()
  } catch {
    redirect("/auth/login")
  }

  const { section = "profile" } = await searchParams

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings.</p>
      </div>
      <AccountSettingsLayout user={currentUser} activeSection={section} />
    </div>
  )
}
