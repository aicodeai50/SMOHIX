import { PageHeaderSkeleton } from "@/components/app/skeletons/ConsoleLoading";
import { Skeleton } from "@/components/app/Skeleton";

export default function SettingsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="grid animate-pulse gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </>
  );
}
