import { Skeleton } from "@/components/app/Skeleton";
import { PageHeaderSkeleton } from "@/components/app/skeletons/ConsoleLoading";

export default function OverviewLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="mb-8 grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </>
  );
}
