"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLogs } from "@/components/nav-logs";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  TruckIcon,
  FactoryIcon,
  StoreIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  CommandIcon,
  PackagePlusIcon,
  Box,
  ShelvingUnit,
  ClipboardClock,
  ScrollTextIcon,
  Receipt,
  UsersIcon,
  MonitorSmartphone,
  LandmarkIcon,
  TagIcon,
  ShoppingCartIcon,
  PackageCheckIcon,
  WarehouseIcon,
  ArrowRightLeftIcon,
} from "lucide-react";

type Role = "admin" | "pharmacist" | "pharmacy_assistant";

type NavItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
  roles?: Role[];
  external?: boolean;
};

type LogItem = {
  name: string;
  url: string;
  icon: React.ReactNode;
  roles?: Role[];
};

const navMain: NavItem[] = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Inventory",
    url: "/admin/inventory",
    icon: <ShelvingUnit />,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: <Box />,
  },
  {
    title: "Batches",
    url: "/admin/batches",
    icon: <PackagePlusIcon />,
  },
  {
    title: "Purchase Orders",
    url: "/admin/purchase-orders",
    icon: <ShoppingCartIcon />,
    roles: ["admin", "pharmacist"],
  },
  {
    title: "Warehouse Receipts",
    url: "/admin/warehouse-receipts",
    icon: <PackageCheckIcon />,
    roles: ["admin"],
  },
  {
    title: "Warehouse",
    url: "/admin/warehouse",
    icon: <WarehouseIcon />,
    roles: ["admin"],
  },
  {
    title: "Stock Transfers",
    url: "/admin/stock-transfers",
    icon: <ArrowRightLeftIcon />,
    roles: ["admin"],
  },
  {
    title: "POS Terminal",
    url: "/pos-terminal",
    icon: <MonitorSmartphone />,
    roles: ["pharmacist"],
    external: true,
  },
];

const navReferenceData: NavItem[] = [
  {
    title: "Suppliers",
    url: "/admin/suppliers",
    icon: <TruckIcon />,
    roles: ["admin"],
  },
  {
    title: "Manufacturers",
    url: "/admin/manufacturers",
    icon: <FactoryIcon />,
    roles: ["admin"],
  },
  {
    title: "Pharmacies",
    url: "/admin/pharmacies",
    icon: <StoreIcon />,
    roles: ["admin"],
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: <UsersIcon />,
    roles: ["admin"],
  },
  {
    title: "Discounts",
    url: "/admin/discounts",
    icon: <TagIcon />,
    roles: ["admin"],
  },
];

const navSecondary: NavItem[] = [
  { title: "Settings", url: "#", icon: <Settings2Icon /> },
  { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
  { title: "Search", url: "#", icon: <SearchIcon /> },
];

const logs: LogItem[] = [
  {
    name: "Inventory Logs",
    url: "/admin/inventory-logs",
    icon: <ScrollTextIcon />,
    roles: ["admin"],
  },
  {
    name: "Transactions",
    url: "/admin/transactions",
    icon: <Receipt />,
    roles: ["admin", "pharmacist"],
  },
  {
    name: "Till Sessions",
    url: "/admin/till-sessions",
    icon: <LandmarkIcon />,
    roles: ["admin"],
  },
  { name: "Time Logs", url: "/admin/time-logs", icon: <ClipboardClock />, roles: ["admin"] },
];

function filterByRole<T extends { roles?: Role[] }>(items: T[], role: Role): T[] {
  return items.filter(item => !item.roles || item.roles.includes(role));
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string;
    email: string;
    avatar: string;
    role?: Role;
    pharmacy_id?: string | null;
  };
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const resolvedUser = user ?? {
    name: "User",
    email: "",
    avatar: "",
  };

  const currentRole: Role = resolvedUser.role ?? "pharmacy_assistant";

  const visibleNavMain = filterByRole(navMain, currentRole);
  const visibleNavReferenceData = filterByRole(navReferenceData, currentRole);
  const visibleLogs = filterByRole(logs, currentRole);
  const visibleNavSecondary = filterByRole(navSecondary, currentRole);

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
              <span className="text-base font-semibold">PharmaMed POS</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleNavMain} />
        {visibleNavReferenceData.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>References</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleNavReferenceData.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      render={<Link href={item.url} />}
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {visibleLogs.length > 0 && <NavLogs items={visibleLogs} />}
        <NavSecondary items={visibleNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
