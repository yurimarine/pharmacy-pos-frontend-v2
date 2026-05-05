import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function PageHeaderSkeleton({
  showButton = true,
  showSelect = false,
}: {
  showButton?: boolean
  showSelect?: boolean
}) {
  const hasRight = showButton || showSelect
  return (
    <div className={hasRight ? "flex items-start justify-between gap-4" : ""}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {showButton && <Skeleton className="h-9 w-32 shrink-0" />}
      {showSelect && !showButton && <Skeleton className="h-9 w-48 shrink-0" />}
    </div>
  )
}

export function FilterBarSkeleton({
  filterCount = 2,
}: {
  filterCount?: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-9 w-64" />
      {Array.from({ length: filterCount }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-36" />
      ))}
    </div>
  )
}

// Varying widths cycle for realistic row skeleton content
const COL_WIDTH_CYCLE = [
  "w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-1/2",
  "w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-1/2",
]

export function TableSkeleton({
  rows = 8,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => {
                const isFirst = colIdx === 0
                const isLast = colIdx === columns - 1
                const width = isFirst
                  ? "w-2/5"
                  : isLast
                    ? "w-6 mx-auto"
                    : COL_WIDTH_CYCLE[colIdx % COL_WIDTH_CYCLE.length]
                return (
                  <TableCell key={colIdx}>
                    <Skeleton className={`h-4 ${width}`} />
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const STAT_GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
}

export function StatCardsSkeleton({
  count = 3,
}: {
  count?: number
}) {
  const colClass = STAT_GRID_COLS[count] ?? "grid-cols-3"
  return (
    <div className={`grid ${colClass} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

export function PaginationSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}
