"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavDocuments } from "@/components/nav-documents";
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
  ClipboardListIcon,
  Box,
  ShelvingUnit,
  ReceiptText,
  ClipboardClock,
  NotebookPen,
  Layers,
  Tag,
  Package,
  Pipette,
} from "lucide-react";

const navMain = [
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
    title: "Order",
    url: "/admin/orders",
    icon: <NotebookPen />,
  },
];

const navReferenceData = [
  {
    title: "Suppliers",
    url: "/admin/suppliers",
    icon: <TruckIcon />,
  },
  {
    title: "Manufacturers",
    url: "/admin/manufacturers",
    icon: <FactoryIcon />,
  },
  {
    title: "Pharmacies",
    url: "/admin/pharmacies",
    icon: <StoreIcon />,
  },
  {
    title: "Product Classes",
    url: "/admin/product-classes",
    icon: <Layers />,
  },
  {
    title: "Product Categories",
    url: "/admin/product-categories",
    icon: <Tag />,
  },
  {
    title: "Packaging Units",
    url: "/admin/packaging-units",
    icon: <Package />,
  },
  {
    title: "Dispensing Units",
    url: "/admin/dispensing-units",
    icon: <Pipette />,
  },
];

const navSecondary = [
  { title: "Settings", url: "#", icon: <Settings2Icon /> },
  { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
  { title: "Search", url: "#", icon: <SearchIcon /> },
];

const documents = [
  {
    name: "Inventory Logs",
    url: "/admin/inventory-logs",
    icon: <ClipboardListIcon />,
  },
  { name: "Transaction Logs", url: "#", icon: <ReceiptText /> },
  { name: "Time Logs", url: "#", icon: <ClipboardClock /> },
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const resolvedUser = user ?? {
    name: "User",
    email: "",
    avatar: "",
  };

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
        <NavMain items={navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>References</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navReferenceData.map(item => (
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
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
