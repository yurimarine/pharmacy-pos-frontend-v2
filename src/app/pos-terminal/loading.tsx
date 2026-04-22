import { Skeleton } from "@/components/ui/skeleton";

export default function POSTerminalLoading() {
  return (
    <div className="flex flex-1 h-full gap-0 overflow-hidden w-full">
      {/* Left panel skeleton */}
      <div className="flex flex-col flex-1 border-r p-4 gap-4 overflow-hidden">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>

      {/* Right panel skeleton */}
      <div className="flex flex-col w-105 shrink-0 p-4 gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
        <div className="mt-auto flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
