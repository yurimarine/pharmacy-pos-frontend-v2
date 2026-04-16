import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-4">
      <ShieldX className="size-16 text-muted-foreground" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground max-w-sm">
          You don&apos;t have permission to access this page. If you believe
          this is a mistake, contact your administrator.
        </p>
      </div>
      <Button render={<Link href="/admin/dashboard" />}>
        Back to Dashboard
      </Button>
    </div>
  )
}
