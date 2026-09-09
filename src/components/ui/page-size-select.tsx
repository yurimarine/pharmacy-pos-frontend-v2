"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAGE_SIZE_OPTIONS } from "@/lib/pagination"

/**
 * "Rows per page" dropdown for the pagination footer of a server-paginated
 * table. Pairs with `resolvePageSize` in @/lib/pagination, which reads the
 * value back out of the URL on the server.
 */
export default function PageSizeSelect({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (size: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="whitespace-nowrap">Rows per page</span>
      <Select
        value={String(value)}
        onValueChange={v => {
          if (v !== null) onChange(Number(v))
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-18" size="sm">
          <SelectValue>{value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map(size => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
