import { Skeleton } from "@/components/app/Skeleton";
import { PageHeaderSkeleton } from "@/components/app/skeletons/ConsoleLoading";

export default function IncidentDetailLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="mb-6 animate-pulse space-y-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </>
  );
}
