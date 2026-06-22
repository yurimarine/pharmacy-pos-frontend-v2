import { ChangePasswordForm } from "@/components/account/ChangePasswordForm"

export default function AccountPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings.</p>
      </div>
      <ChangePasswordForm />
    </div>
  )
}
