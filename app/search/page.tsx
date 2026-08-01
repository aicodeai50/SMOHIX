import type { Metadata } from "next";

import { SearchClient } from "@/components/experience/SearchClient";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mContainer, mEyebrow, mH1, mLede, mSection } from "@/lib/marketing-layout";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Search",
  description: "Search Zentro products, documentation, and pages.",
  path: "/search",
});

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingReveal className={mSection}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Find</p>
            <h1 className={mH1}>Search</h1>
            <p className={mLede}>
              Static index across products, documentation, and key pages. Full-site search backend
              can replace this index later.
            </p>
          </div>
        </MarketingReveal>
        <section className={`${mSection} pb-16`}>
          <div className={`${mContainer} max-w-2xl`}>
            <SearchClient initialQuery={q ?? ""} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
