import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-60" />
      </div>

      <div className="rounded-lg border p-7 flex flex-col gap-8">

        {/* Section 1 - Identity */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-16" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        </div>

        <Skeleton className="h-px" />

        {/* Section 2 - Pharmaceutical */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-36" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
        </div>

        <Skeleton className="h-px" />

        {/* Section 3 - Packaging */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-20" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>

        <Skeleton className="h-px" />

        {/* Section 4 - Pricing */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
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
