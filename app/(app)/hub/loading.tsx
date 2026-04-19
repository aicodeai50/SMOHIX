import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/app/skeletons/ConsoleLoading";

export default function HubLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardGridSkeleton cards={4} />
    </>
  );
}
