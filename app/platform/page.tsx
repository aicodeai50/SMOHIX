import type { Metadata } from "next";

import { PlatformOverview } from "@/components/platform/PlatformOverview";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const metadata: Metadata = {
  title: "Platform overview",
  description:
    "What Shynvo is, how modules connect, guarded automation, runtime modes, and differentiation — for buyers and engineers.",
};

export default function PlatformPage() {
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
