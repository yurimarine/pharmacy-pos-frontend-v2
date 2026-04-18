import { Skeleton } from '@/components/ui/skeleton'

export default function POSInventoryLoading() {
  return (
    <div className="flex flex-col h-full p-6 gap-6 overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-4 flex-shrink-0">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Count skeleton */}
      <Skeleton className="h-4 w-32 flex-shrink-0" />

      {/* Table skeleton */}
      <div className="flex flex-col gap-0 rounded-md border flex-1 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-7 gap-4 px-4 py-3 border-b bg-muted/40">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-7 gap-4 px-4 py-3 border-b last:border-b-0">
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton
                key={j}
                className={`h-4 ${
                  j === 0 ? 'w-full' : j === 1 ? 'w-3/4' : j === 6 ? 'w-1/2' : 'w-full'
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between flex-shrink-0">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>
    </div>
  )
}
