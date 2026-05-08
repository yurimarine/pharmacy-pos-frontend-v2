import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
  PaginationSkeleton,
} from "@/components/skeletons/PageSkeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeaderSkeleton showButton={false} />
      <StatCardsSkeleton count={3} />
      <FilterBarSkeleton filterCount={2} />
      <TableSkeleton rows={10} columns={8} />
      <PaginationSkeleton />
    </div>
  )
}
