import type { Metadata } from "next";

import { HqBrandPreviewBoard } from "@/components/brand/hq/HqBrandPreviewBoard";

export const metadata: Metadata = {
  title: "HQ Brand Preview (Internal)",
  robots: { index: false, follow: false },
};

/** Internal-only HQ identity review — not linked from public navigation or sitemap. */
export default function HqBrandPreviewPage() {
  return (
    <main className="min-h-screen bg-background">
      <HqBrandPreviewBoard />
    </main>
  );
}
