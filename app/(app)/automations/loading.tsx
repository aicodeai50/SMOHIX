import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/app/skeletons/ConsoleLoading";

export default function AutomationsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <TableSkeleton columns={5} rows={6} />
      <div className="mt-6 animate-pulse">
        <div className="h-40 rounded-2xl bg-white/[0.05]" />
      </div>
    </>
  );
}
