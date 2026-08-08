import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { HomepagePricingSection } from "@/components/landing/HomepagePricingSection";
import { PricingFeatureMatrix } from "@/components/pricing/PricingFeatureMatrix";
import { Header } from "@/components/site/Header";
import { getMailtoHref } from "@/lib/billing";
import { isBillingConfigured } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Smohix plans — Free, Pro, Team, and Enterprise. Billed securely via PayPal.",
};

export default function PricingPage() {
  const billingReady = isBillingConfigured();

  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Pricing
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Transparent tiers for platform, SRE, and security teams. Subscriptions and top-ups are
            processed through PayPal — manage everything from your workspace billing page.
          </p>
        </div>
        <HomepagePricingSection />
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <PricingFeatureMatrix />

          {billingReady ? (
            <p className="mt-10 text-sm text-muted">
              Existing subscriber?{" "}
              <Link href="/settings/billing" className="font-medium text-accent hover:underline">
                Manage billing
              </Link>
              .
            </p>
          ) : null}

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
