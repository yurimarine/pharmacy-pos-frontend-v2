import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notification-bell";
import type { NotificationAlerts } from "@/app/admin/notifications/actions";

export function SiteHeader({
  initialAlerts,
}: {
  initialAlerts: NotificationAlerts;
}) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <div className="flex items-center">
          <NotificationBell initialAlerts={initialAlerts} />
        </div>
      </div>
    </header>
  );
}
