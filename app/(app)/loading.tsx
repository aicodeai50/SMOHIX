import {
  CardGridSkeleton,
  PageHeaderSkeleton,
} from "@/components/app/skeletons/ConsoleLoading";

/** Default console shell while any `(app)` route without a more specific `loading.tsx` resolves. */
export default function AppSegmentLoading() {
  return (
    <>
      <PageHeaderSkeleton withCta />
      <CardGridSkeleton cards={4} />
    </>
  );
}
