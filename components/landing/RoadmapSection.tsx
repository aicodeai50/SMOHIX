import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { COMPANY_ROADMAP } from "@/lib/company-identity";
import { mBody, mContainer, mEyebrow, mH2, mLede, mSection } from "@/lib/marketing-layout";

const PHASE_STYLES = {
  now: "border-accent/35 bg-accent/[0.06]",
  next: "border-primary-muted/35 bg-primary-dim",
  future: "border-white/[0.1] bg-white/[0.02]",
} as const;

export function RoadmapSection() {
  return (
    <MarketingReveal
      id="roadmap"
      className={mSection}
      aria-labelledby="roadmap-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>Roadmap</p>
        <h2 id="roadmap-heading" className={`mt-2 ${mH2}`}>
          Where we are headed
        </h2>
        <p className={`${mLede} mt-3 max-w-2xl`}>
          Directional priorities — not release dates. See{" "}
          <Link href="/changelog" className="text-accent hover:underline">
            changelog
          </Link>{" "}
          and{" "}
          <Link href="/next" className="text-accent hover:underline">
            what&apos;s next
          </Link>{" "}
          for shipped work.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {COMPANY_ROADMAP.map((phase) => (
            <article
              key={phase.phase}
              className={`rounded-2xl border p-6 ${PHASE_STYLES[phase.phase]}`}
            >
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                {phase.label}
              </h3>
              <ul className={`mt-4 space-y-3 ${mBody}`}>
                {phase.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-accent" aria-hidden>
                      ·
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </MarketingReveal>
  );
}
