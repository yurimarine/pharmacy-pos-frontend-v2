"use client"

import * as React from "react"

import Link from "next/link"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  TruckIcon,
  UsersIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  CommandIcon,
} from "lucide-react"

const navMain = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Inventory",
    url: "/admin/inventory",
    icon: <ListIcon />,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: <ChartBarIcon />,
  },
  {
    title: "Projects",
    url: "#",
    icon: <FolderIcon />,
  },
  {
    title: "Suppliers",
    url: "/admin/suppliers",
    icon: <TruckIcon />,
  },
  {
    title: "Team",
    url: "#",
    icon: <UsersIcon />,
  },
]

const navSecondary = [
  { title: "Settings", url: "#", icon: <Settings2Icon /> },
  { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
  { title: "Search", url: "#", icon: <SearchIcon /> },
]

const documents = [
  { name: "Data Library", url: "#", icon: <DatabaseIcon /> },
  { name: "Reports", url: "#", icon: <FileChartColumnIcon /> },
  { name: "Word Assistant", url: "#", icon: <FileIcon /> },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string
    email: string
    avatar: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const resolvedUser = user ?? {
    name: "User",
    email: "",
    avatar: "",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/admin/dashboard" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">PharmaCare POS</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
