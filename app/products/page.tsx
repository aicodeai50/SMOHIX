import type { Metadata } from "next";
import Link from "next/link";

import { SmohixHorizon } from "@/components/architecture";
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
  mSystemMeta,
} from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Products",
  description: `${SITE_COMPANY_NAME} — Smohix AI, Platform, Assistant, Smohix PRI, APIs, and honest maturity labels for every workspace.`,
  path: "/products",
});

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingReveal className={`${mSection} smohix-products-page-hero`}>
          <div className={mContainer}>
            <div className="smohix-products-page-hero__opening">
              <SmohixHorizon className="max-w-md" />
              <p className={`mt-3 ${mSystemMeta} text-muted/75`}>Smohix ecosystem · product system</p>
            </div>
            <p className={`${mEyebrow} mt-8 text-accent/80`}>Products</p>
            <h1 className={`mt-2 ${mH1}`}>Smohix Technologies products</h1>
            <p className={mLede}>
              Flagship workspaces and platform capabilities — each card links to a real destination
              with honest maturity labels.
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
