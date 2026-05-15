import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/get-current-user"
import { getNotificationAlerts } from "@/app/admin/notifications/actions"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let currentUser
  try {
    currentUser = await getCurrentUser()
  } catch {
    redirect("/auth/login")
  }

  const pharmacyId = currentUser.role === "admin" ? undefined : currentUser.pharmacy_id
  const initialAlerts = await getNotificationAlerts(pharmacyId)

  const sidebarUser = {
    name: currentUser.name,
    email: currentUser.email,
    avatar: "",
    role: currentUser.role,
    pharmacy_id: currentUser.pharmacy_id,
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={sidebarUser} />
      <SidebarInset>
        <SiteHeader initialAlerts={initialAlerts} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
