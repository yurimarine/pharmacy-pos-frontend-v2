import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
} from '@/components/skeletons/PageSkeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ReportsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <PageHeaderSkeleton showButton={false} />
      <div className="flex gap-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-48" />
      </div>
      <StatCardsSkeleton count={4} />
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TableSkeleton rows={8} columns={5} />
        <TableSkeleton rows={6} columns={4} />
      </div>
      <TableSkeleton rows={5} columns={5} />
    </div>
  )
}
