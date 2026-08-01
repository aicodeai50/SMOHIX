import type { Metadata } from "next";
import Link from "next/link";

import { FaqAccordion } from "@/components/experience/FaqAccordion";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mContainer, mEyebrow, mH1, mLede, mLinkInline, mSection } from "@/lib/marketing-layout";

export const metadata: Metadata = buildMarketingMetadata({
  title: "FAQ",
  description:
    "Frequently asked questions about Zentro products, developers, pricing, security, enterprise, pilots, and privacy.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingReveal className={mSection}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Help</p>
            <h1 className={mH1}>Frequently asked questions</h1>
            <p className={mLede}>
              Straight answers grouped by topic. For product-specific questions, see each product page.
            </p>
            <Link href="/contact" className={`mt-4 inline-block text-sm ${mLinkInline}`}>
              Contact us →
            </Link>
          </div>
        </MarketingReveal>
        <section className={`${mSection} pb-16`}>
          <div className={`${mContainer} max-w-3xl`}>
            <FaqAccordion />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
