import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  FilterBarSkeleton,
  TableSkeleton,
  PaginationSkeleton,
} from "@/components/skeletons/PageSkeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeaderSkeleton showButton={true} />
      <StatCardsSkeleton count={3} />
      <FilterBarSkeleton filterCount={2} />
      <TableSkeleton rows={8} columns={9} />
      <PaginationSkeleton />
    </div>
  )
}
