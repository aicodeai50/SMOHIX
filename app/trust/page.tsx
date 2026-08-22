import type { Metadata } from "next";
import Link from "next/link";

import { TrustEvidenceField } from "@/components/trust/TrustEvidenceField";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mLinkInline, mSection } from "@/lib/marketing-layout";
import { SITE_PUBLIC_BRAND } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Trust Center",
  description: `Security, privacy, responsible AI, and product maturity disclosure for ${SITE_PUBLIC_BRAND} — truthful commitments only.`,
  path: "/trust",
});

export default function TrustPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="smohix-trust-authority flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <TrustEvidenceField />
            <p className={`mt-12 flex flex-wrap gap-x-4 gap-y-2 ${mBody}`}>
              <Link href="/privacy" className={mLinkInline}>
                Privacy →
              </Link>
              <Link href="/" className={mLinkInline}>
                ← Home
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
