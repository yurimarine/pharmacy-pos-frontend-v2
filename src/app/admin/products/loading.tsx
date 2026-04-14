import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Columns: SKU, Barcode, Name, Class, Category, Type, Base Price,
//          Packaging, Supplier, Manufacturer, Prescription, Status, Actions
const COLUMN_COUNT = 13
const ROWS = Array.from({ length: 8 })

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-64" />
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
      <Skeleton className="h-4 w-32" />

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
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
                      className={`h-4 ${
                        colIdx === 2
                          ? "w-40"
                          : colIdx === COLUMN_COUNT - 1
                          ? "mx-auto w-6"
                          : "w-20"
                      }`}
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
