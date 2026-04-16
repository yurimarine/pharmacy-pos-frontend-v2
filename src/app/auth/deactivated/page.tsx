import Link from 'next/link'
import { UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DeactivatedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-4">
      <UserX className="size-16 text-muted-foreground" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Account Deactivated
        </h1>
        <p className="text-muted-foreground max-w-sm">
          Your account has been deactivated. Please contact your administrator
          to regain access.
        </p>
      </div>
      <Button render={<Link href="/auth/login" />}>Back to Login</Button>
    </div>
  )
}
