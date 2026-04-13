import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const ITEM_COLS = 7
const ROWS = Array.from({ length: 5 })

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      {/* Back button */}
      <Skeleton className="h-8 w-36" />

      {/* Header card */}
      <div className="rounded-lg border p-6 flex flex-col gap-4">
        <Skeleton className="h-7 w-48 font-mono" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      {/* Items section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: ITEM_COLS }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {Array.from({ length: ITEM_COLS }).map((_, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton className={`h-4 ${colIdx === 0 ? "w-40" : "w-24"}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  )
}
