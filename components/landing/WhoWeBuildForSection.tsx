import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { AUDIENCE_SEGMENTS } from "@/lib/company-identity";
import { mBody, mContainer, mEyebrow, mH2, mLede, mSection } from "@/lib/marketing-layout";

export function WhoWeBuildForSection() {
  return (
    <MarketingReveal
      id="solutions"
      className={mSection}
      aria-labelledby="audiences-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>Who we build for</p>
        <h2 id="audiences-heading" className={`mt-2 ${mH2}`}>
          Built for teams with real stakes
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          From individual developers to enterprise and regulated environments — Smohix
          adapts to how you operate, not the other way around.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCE_SEGMENTS.map((segment) => (
            <Link
              key={segment.id}
              href={segment.href}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/30"
            >
              <h3 className="text-lg font-semibold text-foreground">{segment.title}</h3>
              <p className={`mt-2 ${mBody}`}>{segment.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-accent">
                View solution →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </MarketingReveal>
  );
}
