import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { Button } from "@/components/ui/Button";
import { mBody, mContainer, mEyebrow, mH2, mSection } from "@/lib/marketing-layout";

export function HomepageDevelopersSection() {
  return (
    <MarketingReveal
      id="developers"
      className={`${mSection} border-y border-white/[0.06]`}
      aria-labelledby="dev-band-heading"
    >
      <div className={`${mContainer} flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center`}>
        <div>
          <p className={`${mEyebrow} text-primary-muted`}>Build with Smohix</p>
          <h2 id="dev-band-heading" className={mH2}>
            Developer platform
          </h2>
          <p className={`mt-2 max-w-xl ${mBody}`}>
            Smohix API catalog, API keys (zentro_sk_ prefix — legacy-compatible), ingest tokens,
            and GitHub source — labeled honestly for what ships today.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <TrackableLink href="/developers" event="developer_quick_start">
            <Button>Developer hub</Button>
          </TrackableLink>
          <TrackableLink href="/docs/api" event="documentation_link">
            <Button variant="secondary">API reference</Button>
          </TrackableLink>
        </div>
      </div>
    </MarketingReveal>
  );
}
