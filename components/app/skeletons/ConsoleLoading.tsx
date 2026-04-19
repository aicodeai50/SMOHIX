import { Skeleton, SkeletonText } from "@/components/app/Skeleton";

export function PageHeaderSkeleton({ withCta }: { withCta?: boolean }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1 animate-pulse">
        <SkeletonText className="w-20" />
        <Skeleton className="mt-3 h-8 w-56 max-w-full" />
        <SkeletonText className="mt-3 w-full max-w-xl" />
        <SkeletonText className="mt-2 w-full max-w-lg" />
      </div>
      {withCta ? <Skeleton className="h-10 w-36 shrink-0 rounded-xl" /> : null}
    </div>
  );
}

export function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="shynvo-table-wrap animate-pulse">
      <div className="flex border-b border-white/[0.06] bg-white/[0.03] px-4 py-3.5">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonText key={i} className="mx-1 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-white/[0.05]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-2 px-4 py-3">
            {Array.from({ length: columns }).map((_, c) => (
              <SkeletonText key={c} className="mx-1 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ cards }: { cards: number }) {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}

export function CopilotSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <Skeleton className="h-72 rounded-2xl" />
        <SkeletonText className="w-48" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export function TwoColumnFormSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="min-h-[200px] rounded-2xl" />
        <Skeleton className="min-h-[200px] rounded-2xl" />
      </div>
    </div>
  );
}
