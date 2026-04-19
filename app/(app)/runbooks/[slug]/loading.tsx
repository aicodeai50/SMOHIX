import { PageHeaderSkeleton } from "@/components/app/skeletons/ConsoleLoading";
import { Skeleton } from "@/components/app/Skeleton";

export default function RunbookDetailLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="animate-pulse space-y-3">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-6 w-[min(100%,28rem)] rounded" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </>
  );
}
