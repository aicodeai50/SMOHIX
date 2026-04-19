import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/app/skeletons/ConsoleLoading";

export default function IncidentsLoading() {
  return (
    <>
      <PageHeaderSkeleton withCta />
      <TableSkeleton columns={8} rows={10} />
    </>
  );
}
