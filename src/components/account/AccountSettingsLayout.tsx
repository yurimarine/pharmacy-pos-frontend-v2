"use client"

import { useRouter } from "next/navigation"
import { UserRoundIcon, ShieldIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { type CurrentUser } from "@/lib/get-current-user"
import { ROLE_LABELS } from "@/types/user"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm"

const NAV_ITEMS = [
  { key: "profile", label: "Profile", icon: UserRoundIcon },
  { key: "security", label: "Security", icon: ShieldIcon },
] as const

function ProfileSection({ user }: { user: CurrentUser }) {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account information.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Name
          </p>
          <p className="text-sm font-medium">{user.name}</p>
        </div>
        <Separator />
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </p>
          <p className="text-sm">{user.email}</p>
        </div>
        <Separator />
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Role
          </p>
          <p className="text-sm">{ROLE_LABELS[user.role]}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface Props {
  user: CurrentUser
  activeSection: string
}

export function AccountSettingsLayout({ user, activeSection }: Props) {
  const router = useRouter()

  return (
    <div className="flex gap-8">
      <nav className="flex w-40 shrink-0 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => router.push(`/admin/account?section=${item.key}`)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeSection === item.key
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1">
        {activeSection === "security" ? (
          <ChangePasswordForm />
        ) : (
          <ProfileSection user={user} />
        )}
      </div>
    </div>
  )
}
