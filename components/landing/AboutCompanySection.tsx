import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  COMPANY_LONG_TERM_GOALS,
  COMPANY_MISSION,
  COMPANY_NAME,
  COMPANY_VISION,
} from "@/lib/company-identity";
import { mBody, mCard, mContainer, mEyebrow, mH2, mLede, mSection, mStaggerGrid } from "@/lib/marketing-layout";

export function AboutCompanySection() {
  return (
    <MarketingReveal
      id="about"
      className={mSection}
      aria-labelledby="about-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} text-primary-muted`}>About {COMPANY_NAME}</p>
        <h2 id="about-heading" className={`mt-2 ${mH2}`}>
          Who we are and why we exist
        </h2>
        <p className={`${mLede} mt-3 max-w-3xl`}>
          We are an AI technology company building infrastructure for teams that operate
          real production systems — not slide decks.
        </p>

        <div className={`mt-12 grid gap-6 lg:grid-cols-3 ${mStaggerGrid}`}>
          <article className={mCard}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-muted">
              Mission
            </h3>
            <p className={`mt-3 ${mBody} text-foreground/90`}>{COMPANY_MISSION}</p>
          </article>
          <article className={mCard}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-muted">
              Vision
            </h3>
            <p className={`mt-3 ${mBody} text-foreground/90`}>{COMPANY_VISION}</p>
          </article>
          <article className={mCard}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-muted">
              Long-term goals
            </h3>
            <ul className={`mt-3 space-y-2 ${mBody}`}>
              {COMPANY_LONG_TERM_GOALS.map((goal) => (
                <li key={goal} className="flex gap-2">
                  <span className="text-accent" aria-hidden>
                    ·
                  </span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </MarketingReveal>
  );
}
