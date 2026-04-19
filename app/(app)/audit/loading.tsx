import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/app/skeletons/ConsoleLoading";

export default function AuditLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <TableSkeleton columns={5} rows={12} />
    </>
  );
}
