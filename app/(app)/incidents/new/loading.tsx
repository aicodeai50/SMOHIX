import { PageHeaderSkeleton } from "@/components/app/skeletons/ConsoleLoading";
import { Skeleton } from "@/components/app/Skeleton";

export default function NewIncidentLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="max-w-lg animate-pulse space-y-4">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
    </>
  );
}
