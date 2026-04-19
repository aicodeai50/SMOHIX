import {
  CardGridSkeleton,
  PageHeaderSkeleton,
} from "@/components/app/skeletons/ConsoleLoading";

export default function RunbooksLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardGridSkeleton cards={6} />
    </>
  );
}
