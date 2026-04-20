import type { Metadata } from "next";

import { PlatformOverview } from "@/components/platform/PlatformOverview";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const metadata: Metadata = {
  title: "Platform overview",
  description:
    "Detailed platform narrative: guarded automation model, architecture, runtime modes, and differentiation.",
};

export default function PlatformOverviewPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <PlatformOverview />
      </main>
      <Footer />
    </>
  );
}
