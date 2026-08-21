import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { HomepagePricingSection } from "@/components/landing/HomepagePricingSection";
import { PricingFeatureMatrix } from "@/components/pricing/PricingFeatureMatrix";
import { Header } from "@/components/site/Header";
import { getMailtoHref } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Smohix plans — Free, Pro, Team, and Enterprise. Self-serve checkout coming soon; contact us for Pro and Team access.",
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Pricing
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Transparent tiers for platform, SRE, and security teams. Self-serve payments are
            coming soon — reach out via contact or pilot for Pro and Team access.
          </p>
        </div>
        <HomepagePricingSection />
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <PricingFeatureMatrix />

          <p className="mt-10 text-sm text-muted">
            Prefer a scoped engagement?{" "}
            <Link href="/pilot" className="font-medium text-accent hover:underline">
              Start a pilot
            </Link>
            .
          </p>

          <p className="mt-8 text-sm text-muted">
            <Link href="/enterprise" className="font-medium text-accent hover:underline">
              Enterprise overview →
            </Link>
            {" · "}
            <a href={getMailtoHref("enterprise")} className="font-medium text-accent hover:underline">
              Contact sales
            </a>
            {" · "}
            <Link href="/" className="hover:text-accent hover:underline">
              ← Home
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
