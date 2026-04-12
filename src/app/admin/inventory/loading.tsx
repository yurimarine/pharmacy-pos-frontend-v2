import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Inventory columns: Product Name, Generic Name, Category, Pharmacy, Quantity, Stock Status, Selling Price, Actions
const COLUMN_COUNT = 8
const ROWS = Array.from({ length: 8 })

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Pharmacy filter + toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Count */}
      <Skeleton className="h-4 w-40" />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: COLUMN_COUNT }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((_, rowIdx) => (
              <TableRow key={rowIdx}>
                {Array.from({ length: COLUMN_COUNT }).map((_, colIdx) => (
                  <TableCell key={colIdx}>
                    <Skeleton
                      className={`h-4 ${colIdx === 0 ? "w-40" : colIdx === COLUMN_COUNT - 1 ? "w-6 mx-auto" : "w-24"}`}
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
