import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  getCheckoutUrl,
  getMailtoHref,
  getTeamCheckoutUrl,
  getTrialHref,
} from "@/lib/billing";
import { mBody, mContainer, mEyebrow, mH2, mLede, mSection } from "@/lib/marketing-layout";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    detail: "Explore the console layout, platform map, and docs. Sign in to browse modules before subscribing.",
    cta: "Create account",
    href: "/auth/sign-in?next=/hub",
    external: false,
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "Paid",
    detail: "For individual operators — incidents, guarded automations, approvals, and audit export.",
    cta: "Subscribe — Pro",
    href: null as string | null,
    external: true,
    highlight: false,
  },
  {
    id: "team",
    name: "Team",
    price: "Paid",
    detail: "Shared operations with org-scoped governance, delegated approvers, and team billing.",
    cta: "Subscribe — Team",
    href: null as string | null,
    external: true,
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    detail: "Procurement support, retention controls, compliance pack, and dedicated onboarding.",
    cta: "Contact sales",
    href: getMailtoHref("enterprise"),
    external: false,
    highlight: false,
  },
] as const;

export function HomepagePricingSection() {
  const checkout = getCheckoutUrl();
  const teamCheckout = getTeamCheckoutUrl();
  const trialHref = getTrialHref();

  const resolved = PLANS.map((plan) => {
    if (plan.id === "pro") {
      return { ...plan, href: checkout ? trialHref : null, disabled: !checkout };
    }
    if (plan.id === "team") {
      return { ...plan, href: teamCheckout, disabled: !teamCheckout };
    }
    return { ...plan, disabled: false };
  });

  return (
    <MarketingReveal
      id="pricing"
      className={`${mSection} zentro-quantum-section`}
      aria-labelledby="pricing-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} zentro-eyebrow-cyber`}>Pricing</p>
        <h2 id="pricing-heading" className={`zentro-living-headline mt-2 ${mH2}`}>
          Plans that scale with your team
        </h2>
        <p className={mLede}>
          Start free, upgrade when you need shared governance or enterprise procurement. Full
          feature matrix on the pricing page.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resolved.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-5 sm:p-6 ${
                plan.highlight
                  ? "border-accent/30 bg-accent/[0.04]"
                  : "border-white/[0.1] bg-white/[0.02]"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{plan.name}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{plan.price}</p>
              <p className={`mt-3 flex-1 ${mBody}`}>{plan.detail}</p>
              {plan.href && !plan.disabled ? (
                plan.external ? (
                  <a
                    href={plan.href}
                    className={`mt-6 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold ${
                      plan.highlight
                        ? "border border-accent/50 bg-accent/15 text-accent hover:bg-accent/20"
                        : "bg-accent text-background hover:opacity-90"
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    href={plan.href}
                    className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.12] px-4 text-sm font-medium text-foreground/90 hover:border-accent/35"
                  >
                    {plan.cta}
                  </Link>
                )
              ) : plan.id === "free" ? (
                <Link
                  href="/auth/sign-in?next=/hub"
                  className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.12] px-4 text-sm font-medium text-foreground/90 hover:border-accent/35"
                >
                  {plan.cta}
                </Link>
              ) : (
                <p className="mt-6 text-xs text-muted">Available via sales — see pricing page.</p>
              )}
            </div>
          ))}
        </div>

        <p className={`${mBody} mt-8 text-center`}>
          <Link href="/pricing" className="font-medium text-accent hover:underline">
            Compare all plans &amp; features →
          </Link>
        </p>
      </div>
    </MarketingReveal>
  );
}
