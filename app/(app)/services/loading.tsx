import { Skeleton } from "@/components/app/Skeleton";
import { PageHeaderSkeleton } from "@/components/app/skeletons/ConsoleLoading";

export default function ServicesLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="grid animate-pulse gap-6 lg:grid-cols-2">
        <Skeleton className="min-h-[320px] rounded-2xl" />
        <Skeleton className="min-h-[320px] rounded-2xl" />
      </div>
    </>
  );
}
