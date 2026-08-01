import Link from "next/link";
import dynamic from "next/dynamic";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { mBody, mContainer, mEyebrow, mH2, mLede, mSection } from "@/lib/marketing-layout";

const PlatformMap = dynamic(
  () => import("@/components/ecosystem/PlatformMap").then((m) => m.PlatformMap),
  {
    loading: () => (
      <div
        className="mt-10 flex min-h-[320px] items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]"
        aria-busy="true"
        aria-label="Loading platform map"
      >
        <span className="text-sm text-muted">Loading platform map…</span>
      </div>
    ),
  },
);

export function EcosystemSection() {
  return (
    <MarketingReveal
      id="ecosystem"
      className={mSection}
      aria-labelledby="ecosystem-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>One intelligent platform</p>
        <h2 id="ecosystem-heading" className={`mt-2 ${mH2}`}>
          The Zentro ecosystem map
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          Every product is a capability inside the same platform — not a separate silo.
          Explore how AI, API, memory, and identity connect through{" "}
          <Link href="/products/zentro-platform" className="text-accent hover:underline">
            Zentro Platform
          </Link>
          .
        </p>

        <PlatformMap />

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/architecture"
            className={`rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40 ${mBody}`}
          >
            System architecture →
          </Link>
          <Link
            href="/technology"
            className={`rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40 ${mBody}`}
          >
            Technology stack →
          </Link>
        </div>
      </div>
    </MarketingReveal>
  );
}
