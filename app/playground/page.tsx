import type { Metadata } from "next";
import Link from "next/link";

import { ApiRequestBuilder } from "@/components/developers/ApiRequestBuilder";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mContainer, mEyebrow, mH1, mLede, mLinkInline, mSection } from "@/lib/marketing-layout";

export const metadata: Metadata = buildMarketingMetadata({
  title: "API request builder",
  description:
    "Generate copyable curl, JavaScript, and TypeScript examples for documented Zentro API routes — examples are not executed from the browser.",
  path: "/playground",
});

export default function PlaygroundPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <MarketingReveal className={mSection}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Developers</p>
            <h1 className={mH1}>API request builder</h1>
            <p className={mLede}>
              Copy example requests for documented routes at{" "}
              <Link href="/docs/api" className={mLinkInline}>
                /docs/api
              </Link>
              . Nothing is executed from this page — run requests in your own terminal or server with
              a valid API key.
            </p>
            <Link href="/developers" className={`mt-4 inline-block text-sm ${mLinkInline}`}>
              Developer hub →
            </Link>
          </div>
        </MarketingReveal>
        <section className={`${mSection} pb-16`}>
          <div className={`${mContainer} max-w-3xl`}>
            <ApiRequestBuilder />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
