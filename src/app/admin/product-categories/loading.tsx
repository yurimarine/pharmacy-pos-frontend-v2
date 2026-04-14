import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Columns: Name, Class, Description, Created At, Actions
const COLUMN_WIDTHS = ["w-3/4", "w-1/2", "w-full", "w-1/2", "w-6"]
const ROWS = Array.from({ length: 6 })

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Count */}
      <Skeleton className="h-4 w-44" />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMN_WIDTHS.map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((_, rowIdx) => (
              <TableRow key={rowIdx}>
                {COLUMN_WIDTHS.map((width, colIdx) => (
                  <TableCell key={colIdx}>
                    <Skeleton
                      className={`h-4 ${width} ${colIdx === COLUMN_WIDTHS.length - 1 ? "mx-auto" : ""}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}
