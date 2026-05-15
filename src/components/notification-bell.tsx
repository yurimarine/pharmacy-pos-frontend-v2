"use client"

import { useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getStockStatus } from "@/lib/inventory-utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { AlertItem, NotificationAlerts } from "@/app/admin/notifications/actions"

export function NotificationBell({ initialAlerts }: { initialAlerts: NotificationAlerts }) {
  const [alerts, setAlerts] = useState<NotificationAlerts>(initialAlerts)
  const [isRinging, setIsRinging] = useState(false)

  const alertedIds = useRef<Set<string>>(
    new Set([
      ...initialAlerts.lowStock.map((i) => i.id),
      ...initialAlerts.outOfStock.map((i) => i.id),
    ])
  )

  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function triggerNotification(
      rowId: string,
      status: "low_stock" | "out_of_stock"
    ) {
      const { data } = await supabase
        .from("pharmacy_inventory")
        .select(
          "id, quantity, low_stock_threshold, pharmacy_id, products(product_name), pharmacies(name)"
        )
        .eq("id", rowId)
        .single()

      if (!data) return

      const newItem: AlertItem = {
        id: data.id,
        productName: (data.products as unknown as { product_name: string } | null)?.product_name ?? "Unknown",
        pharmacyName: (data.pharmacies as unknown as { name: string } | null)?.name ?? "Unknown",
        pharmacyId: data.pharmacy_id,
        quantity: data.quantity,
        threshold: data.low_stock_threshold,
      }

      setAlerts((prev) => {
        const next = { ...prev }
        if (status === "low_stock") {
          next.lowStock = [...prev.lowStock, newItem]
        } else {
          next.outOfStock = [...prev.outOfStock, newItem]
        }
        next.total = prev.total + 1
        return next
      })

      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current)
      setIsRinging(true)
      ringTimeoutRef.current = setTimeout(() => setIsRinging(false), 1000)
      new Audio("/notification.mp3").play().catch(() => {})
    }

    const channel = supabase
      .channel("pharmacy_inventory_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pharmacy_inventory" },
        (payload) => {
          const row = payload.new as {
            id: string
            quantity: number
            low_stock_threshold: number
            expiry_date: string | null
          }
          const status = getStockStatus(row.quantity, row.low_stock_threshold, row.expiry_date)
          if (
            (status === "low_stock" || status === "out_of_stock") &&
            !alertedIds.current.has(row.id)
          ) {
            alertedIds.current.add(row.id)
            triggerNotification(row.id, status)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (ringTimeoutRef.current) clearTimeout(ringTimeoutRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Bell
              className={`h-5 w-5 ${isRinging ? "bell-ringing" : ""}`}
            />
            {alerts.total > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-medium text-destructive-foreground">
                {alerts.total > 99 ? "99+" : alerts.total}
              </span>
            )}
          </button>
        }
      />
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
        </div>

        {alerts.total === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            No alerts
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <AlertSection
              title="Expired"
              items={alerts.expired}
              status="expired"
            />
            <AlertSection
              title="Near Expiry"
              items={alerts.nearExpiry}
              status="near_expiry"
            />
            <AlertSection
              title="Out of Stock"
              items={alerts.outOfStock}
              status="out_of_stock"
            />
            <AlertSection
              title="Low Stock"
              items={alerts.lowStock}
              status="low_stock"
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function AlertSection({
  title,
  items,
  status,
}: {
  title: string
  items: AlertItem[]
  status: string
}) {
  if (items.length === 0) return null

  return (
    <div className="border-b last:border-b-0">
      <div className="px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title} ({items.length})
        </span>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/admin/inventory?pharmacy=${item.pharmacyId}&status=${status}`}
              className="flex flex-col gap-0.5 px-4 py-2 text-sm hover:bg-accent"
            >
              <span className="font-medium leading-tight">{item.productName}</span>
              <span className="text-xs text-muted-foreground">{item.pharmacyName}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
