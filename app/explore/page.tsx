import type { Metadata } from "next";
import Link from "next/link";

import { HowSmohixWorksJourney } from "@/components/experience/HowSmohixWorksJourney";
import { ProductOrientation } from "@/components/experience/ProductOrientation";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mContainer, mEyebrow, mH1, mLede, mLinkInline, mSection } from "@/lib/marketing-layout";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Explore Smohix",
  description:
    "Product orientation for Smohix Technologies — company, products, architecture, developers, and trust. Links to real destinations only.",
  path: "/explore",
});

export default function ExplorePage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingReveal className={mSection}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Product orientation</p>
            <h1 className={mH1}>Explore Smohix</h1>
            <p className={mLede}>
              Learn how Smohix Technologies products connect — with honest maturity labels and links
              to live routes, documentation, and pilots.
            </p>
            <Link href="/products" className={`mt-4 inline-block text-sm ${mLinkInline}`}>
              Product Access →
            </Link>
          </div>
        </MarketingReveal>
        <section className={mSection}>
          <div className={`${mContainer} max-w-3xl`}>
            <ProductOrientation />
          </div>
        </section>
        <MarketingReveal className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <h2 className="text-xl font-semibold text-foreground">How Smohix works</h2>
            <p className={`mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted`}>
              Architecture illustration — not a live dashboard.
            </p>
            <div className="mt-8">
              <HowSmohixWorksJourney />
            </div>
          </div>
        </MarketingReveal>
      </main>
      <Footer />
    </>
  );
}
