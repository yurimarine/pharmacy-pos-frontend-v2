import { Skeleton } from "@/components/ui/skeleton"

export default function InventoryLogsLoading() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Count */}
      <Skeleton className="h-4 w-28" />

      {/* Table */}
      <div className="rounded-md border">
        <div className="p-1">
          {/* Header row */}
          <div className="flex gap-4 px-4 py-3 border-b">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-0">
              {Array.from({ length: 8 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  )
}
