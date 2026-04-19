import { PageHeaderSkeleton } from "@/components/app/skeletons/ConsoleLoading";
import { Skeleton } from "@/components/app/Skeleton";

export default function VisionLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="animate-pulse space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </>
  );
}
