import type { Metadata } from "next";
import Link from "next/link";

import { ProductAccessHub } from "@/components/products/ProductAccessHub";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import {
  mContainer,
  mEyebrow,
  mH1,
  mLede,
  mLinkInline,
  mSection,
} from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Product Access",
  description: `${SITE_COMPANY_NAME} — open live products, documentation, and pilots. Real destinations only.`,
  path: "/products",
});

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingReveal className={mSection}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Product Access</p>
            <h1 className={`mt-2 ${mH1}`}>Zentro Technologies products</h1>
            <p className={mLede}>
              The real front door to {SITE_COMPANY_NAME} products. Each card links to live routes,
              documentation, or pilot intake — never simulated dashboards.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <Link href="/explore" className={mLinkInline}>
                Product orientation →
              </Link>
              <Link href="/status" className={mLinkInline}>
                Service status →
              </Link>
              <Link href="/#ecosystem" className={mLinkInline}>
                Ecosystem map →
              </Link>
            </div>
          </div>
        </MarketingReveal>
        <MarketingReveal className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <ProductAccessHub />
          </div>
        </MarketingReveal>
      </main>
      <Footer />
    </>
  );
}
