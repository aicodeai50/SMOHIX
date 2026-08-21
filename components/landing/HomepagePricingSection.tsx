import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { mBody, mContainer, mEyebrow, mH2, mLede, mSection } from "@/lib/marketing-layout";
import { PRICING_TIERS } from "@/lib/product-identity";

export function HomepagePricingSection() {
  return (
    <MarketingReveal
      id="pricing"
      className={`${mSection} border-b border-white/[0.06]`}
      aria-labelledby="pricing-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>Pricing</p>
        <h2 id="pricing-heading" className={`mt-2 ${mH2}`}>
          Plans that scale with your team
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          Transparent published tiers. Self-serve checkout is coming soon —
          contact us or start a pilot for Pro and Team access today.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((plan) => {
            const href =
              plan.id === "free" ? "/auth/sign-in?next=/hub" : "/contact";

            return (
              <Card
                key={plan.id}
                className={`flex flex-col ${
                  plan.highlight
                    ? "border-accent/35 ring-1 ring-accent/20"
                    : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="text-2xl font-bold text-foreground">
                    {plan.price}
                    <span className="text-sm font-normal text-muted">{plan.period}</span>
                  </p>
                </div>
                <p className={`mt-3 ${mBody} text-muted`}>{plan.description}</p>
                <ul className={`mt-4 flex-1 space-y-2 ${mBody}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-foreground/85">
                      <span className="text-accent">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={href} className="mt-6 block">
                  <Button
                    variant={plan.highlight ? "primary" : "secondary"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>

        <p className={`mt-8 ${mBody} text-muted`}>
          Need enterprise procurement or custom retention?{" "}
          <Link href="/enterprise" className="text-accent hover:underline">
            Contact sales
          </Link>
          .
        </p>
      </div>
    </MarketingReveal>
  );
}
