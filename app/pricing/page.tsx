import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  SITE_EMAIL_CONTACT,
  getCheckoutUrl,
  getCustomerPortalUrl,
  getTeamCheckoutUrl,
  getTrialHref,
} from "@/lib/billing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Shynvo plans — Pro, Team, and how to talk to us for larger rollouts.",
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
            Transparent tiers build trust even when the product is young. Limits and entitlements
            evolve with billing webhooks — check the checkout for the current commercial packaging.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.02] p-6">
              <h2 className="text-lg font-semibold text-foreground">Pro</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Individual or small team serious about incidents, ingest tokens, and paid-gated
                automation paths when enabled in your deployment.
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
                <p className="mt-6 text-xs text-muted">
                  Configure <code className="font-mono text-accent/90">NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL</code>{" "}
                  to enable checkout.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-accent/25 bg-accent/[0.04] p-6">
              <h2 className="text-lg font-semibold text-foreground">Team</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Second checkout when you offer a team SKU — same console, packaging aimed at shared
                operational use (details in your Lemon product setup).
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
                <p className="mt-6 text-xs text-muted">
                  Optional: set{" "}
                  <code className="font-mono text-accent/90">NEXT_PUBLIC_LEMONSQUEEZY_TEAM_CHECKOUT_URL</code>.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-white/[0.1] bg-white/[0.02] p-6">
              <h2 className="text-lg font-semibold text-foreground">Enterprise</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                SSO, custom SLAs, procurement, and integration priority — conversation-led. We will
                not pretend those are self-serve buttons before they exist.
              </p>
              <a
                href={`mailto:${SITE_EMAIL_CONTACT}?subject=${encodeURIComponent("Shynvo enterprise")}`}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.12] px-4 text-sm font-medium text-foreground/90 hover:border-accent/35"
              >
                Contact sales
              </a>
            </div>
          </div>

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
            <Link href="/platform" className="font-medium text-accent hover:underline">
              What you are buying — platform overview →
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
