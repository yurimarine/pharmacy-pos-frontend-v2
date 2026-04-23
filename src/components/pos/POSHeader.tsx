"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ShoppingCartIcon,
  PackageIcon,
  ClockIcon,
  LogOutIcon,
  LayoutDashboardIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { usePOS } from "@/context/POSContext";
import { TillSessionIndicator } from "@/components/pos/TillSessionIndicator";

type Role = "admin" | "pharmacist" | "pharmacy_assistant";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  pharmacist: "Pharmacist",
  pharmacy_assistant: "Pharmacy Assistant",
};

function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-sm tabular-nums text-muted-foreground">
      {time}
    </span>
  );
}

export function POSHeader() {
  const { userName, pharmacyName, userRole } = usePOS();
  const pathname = usePathname();
  const router = useRouter();

  const initials = userName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign out failed", { description: error.message });
      return;
    }
    router.push("/auth/login");
  };

  const navLinks = [
    {
      href: "/pos-terminal",
      label: "POS",
      icon: ShoppingCartIcon,
      exact: true,
    },
    {
      href: "/pos-terminal/inventory",
      label: "Inventory",
      icon: PackageIcon,
      exact: false,
    },
    {
      href: "/pos-terminal/transactions",
      label: "Transactions",
      icon: ClockIcon,
      exact: false,
    },
  ];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 gap-4">
      {/* Brand + clock */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-sm tracking-tight">
            PharmaMed{" "}
            <span className="text-muted-foreground font-normal">POS</span>
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-45">
            {pharmacyName}
          </span>
        </div>
        <LiveClock />
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-1">
        {navLinks.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Button
              key={href}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              render={<Link href={href} />}
              nativeButton={false}
              className="gap-1.5"
            >
              <Icon className="size-4" />
              {label}
            </Button>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <TillSessionIndicator />
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/admin/dashboard" />}
          nativeButton={false}
          className="gap-1.5 text-muted-foreground"
        >
          <LayoutDashboardIcon className="size-4" />
          Admin
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" className="gap-2" />}
          >
            <Avatar className="size-6">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{userName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {ROLE_LABELS[userRole]}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOutIcon className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
