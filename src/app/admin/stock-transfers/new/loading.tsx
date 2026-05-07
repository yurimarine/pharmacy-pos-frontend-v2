import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="flex flex-col gap-0">
        {/* Section 1 - Transfer details */}
        <div className="flex flex-col gap-4 pb-6">
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </div>

        <Skeleton className="h-px" />

        {/* Section 2 - Transfer items */}
        <div className="flex flex-col gap-4 pt-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="grid grid-cols-[2fr_2fr_90px_120px_36px] gap-2"
              >
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            ))}
          </div>
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Footer */}
        <div className="border-t pt-6 mt-6 flex justify-between">
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
    </div>
  )
}
