import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>

      <div className="flex flex-col gap-8">
        {/* Section 1 - Order details */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>

        <Skeleton className="h-px" />

        {/* Section 2 - Order items */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[2fr_80px_120px_100px_1fr_36px] gap-2">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9 w-9" />
            </div>
            <div className="grid grid-cols-[2fr_80px_120px_100px_1fr_36px] gap-2">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Footer */}
        <div className="border-t pt-6 flex justify-between">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
