import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { PricingFeatureMatrix } from "@/components/pricing/PricingFeatureMatrix";
import {
  SITE_EMAIL_CONTACT,
  getCheckoutUrl,
  getCustomerPortalUrl,
  getMailtoHref,
  getTeamCheckoutUrl,
  getTrialHref,
} from "@/lib/billing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Zentro plans — Free, Pro, Team, Enterprise, and how to talk to us for larger rollouts.",
};

export default function PricingPage() {
  const checkout = getCheckoutUrl();
  const teamCheckout = getTeamCheckoutUrl();
  const trialHref = getTrialHref();
  const portal = getCustomerPortalUrl();

  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Pricing
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Clear plans for teams adopting operational and security automation. Feature availability
            and limits are shown at checkout and inside your workspace billing view.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.02] p-6">
              <h2 className="text-lg font-semibold text-foreground">Free</h2>
              <p className="mt-1 text-sm font-medium text-muted">$0</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Explore the console layout, platform map, and documentation before you subscribe.
              </p>
              <Link
                href="/auth/sign-in?next=/hub"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.12] px-4 text-sm font-medium text-foreground/90 hover:border-accent/35"
              >
                Create account
              </Link>
            </div>

            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.02] p-6">
              <h2 className="text-lg font-semibold text-foreground">Pro</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                For individual operators and smaller teams managing incidents, approvals, and audit
                records.
              </p>
              {checkout ? (
                <a
                  href={trialHref}
                  className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-background hover:opacity-90"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe — Pro
                </a>
              ) : (
                <p className="mt-6 text-xs text-muted">Checkout is not currently available for this plan.</p>
              )}
            </div>

            <div className="rounded-2xl border border-accent/25 bg-accent/[0.04] p-6">
              <h2 className="text-lg font-semibold text-foreground">Team</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                For teams running shared operations with centralized ownership and governance workflows.
              </p>
              {teamCheckout ? (
                <a
                  href={teamCheckout}
                  className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-accent/50 bg-accent/15 px-4 text-sm font-semibold text-accent hover:bg-accent/20"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe — Team
                </a>
              ) : (
                <p className="mt-6 text-xs text-muted">Team checkout is currently offered through sales.</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.02] p-6">
              <h2 className="text-lg font-semibold text-foreground">Enterprise</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                For larger rollouts requiring procurement support, custom terms, and advanced
                operational controls.
              </p>
              <a
                href={getMailtoHref("enterprise")}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.12] px-4 text-sm font-medium text-foreground/90 hover:border-accent/35"
              >
                Contact sales
              </a>
            </div>
          </div>

          <PricingFeatureMatrix />

          {portal ? (
            <p className="mt-10 text-sm text-muted">
              Existing subscriber?{" "}
              <a href={portal} className="font-medium text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                Customer portal
              </a>
              .
            </p>
          ) : null}

          <p className="mt-8 text-sm text-muted">
            <Link href="/enterprise" className="font-medium text-accent hover:underline">
              Enterprise overview →
            </Link>
            {" · "}
            <Link href="/next" className="font-medium text-accent hover:underline">
              Roadmap →
            </Link>
            {" · "}
            <Link href="/platform" className="font-medium text-accent hover:underline">
              Platform →
            </Link>
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
