import type { Metadata } from "next";

import { PlatformControlLayer } from "@/components/platform/PlatformControlLayer";
import { PlatformCoreField } from "@/components/platform/PlatformCoreField";
import { PlatformHero } from "@/components/platform/PlatformHero";
import { PlatformSurfaceMap } from "@/components/platform/PlatformSurfaceMap";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mContainer, mSection } from "@/lib/marketing-layout";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Platform",
  description:
    "Smohix Platform — operational workspace for organizations, projects, knowledge, agents, usage, and administration after sign-in.",
  path: "/platform",
});

export default function PlatformPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <PlatformHero />
        <MarketingReveal className={`${mSection} border-t border-white/[0.06]`}>
          <div className={mContainer}>
            <PlatformCoreField />
          </div>
        </MarketingReveal>
        <MarketingReveal className={`${mSection} border-t border-white/[0.06]`}>
          <div className={mContainer}>
            <PlatformControlLayer />
          </div>
        </MarketingReveal>
        <MarketingReveal className={`${mSection} border-t border-white/[0.06] pb-16`}>
          <div className={mContainer}>
            <PlatformSurfaceMap />
          </div>
        </MarketingReveal>
      </main>
      <Footer />
    </>
  );
}
