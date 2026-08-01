import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { mBody, mContainer, mEyebrow, mH2, mLede, mSection } from "@/lib/marketing-layout";
import { SITE_BRAND_BYLINE, SITE_PUBLIC_BRAND } from "@/lib/site-brand";

const BRAND_POINTS = [
  {
    title: "One public home",
    body: "Every product, doc, and console entry point lives at zentro.run — not scattered microsites.",
  },
  {
    title: "Connected products",
    body: "Platform, AI, API, and Identity share auth, audit context, and the ecosystem map.",
  },
  {
    title: "Shared intelligence layer",
    body: "Copilot and reasoning routes through same-origin APIs with optional private backends.",
  },
  {
    title: "Shared developer platform",
    body: "One API catalog, key model, and documentation spine for integrators.",
  },
  {
    title: "Transparent maturity",
    body: "Live, Preview, Prototype, and Coming soon labels — no pretense that roadmap items are GA.",
  },
] as const;

export function WhyZentroRunSection() {
  return (
    <MarketingReveal
      id="why-zentro-run"
      className={mSection}
      aria-labelledby="why-zentro-run-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>Public brand</p>
        <h2 id="why-zentro-run-heading" className={mH2}>
          Why {SITE_PUBLIC_BRAND}
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          {SITE_BRAND_BYLINE} — one company, one ecosystem, honest about what ships today
          versus what is still on the roadmap.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BRAND_POINTS.map((point) => (
            <li
              key={point.title}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-[border-color] hover:border-accent/25"
            >
              <h3 className="font-semibold text-foreground">{point.title}</h3>
              <p className={`mt-2 ${mBody}`}>{point.body}</p>
            </li>
          ))}
        </ul>

        <p className={`mt-8 ${mBody}`}>
          Explore the{" "}
          <Link href="/architecture" className="text-accent hover:underline">
            architecture
          </Link>{" "}
          or read our{" "}
          <Link href="/trust" className="text-accent hover:underline">
            trust center
          </Link>
          .
        </p>
      </div>
    </MarketingReveal>
  );
}
