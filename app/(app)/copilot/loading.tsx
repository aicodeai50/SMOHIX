import { CopilotSkeleton, PageHeaderSkeleton } from "@/components/app/skeletons/ConsoleLoading";

export default function CopilotLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CopilotSkeleton />
    </>
  );
}
