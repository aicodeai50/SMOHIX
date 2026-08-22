import Link from "next/link";

import { SmohixHorizon } from "@/components/architecture";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { Button } from "@/components/ui/Button";
import { DEVELOPER_NAV } from "@/lib/developer-journey";
import {
  mBody,
  mContainer,
  mEyebrow,
  mFocusRing,
  mH1,
  mLede,
  mLinkInline,
  mSection,
  mSystemMeta,
} from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

export function DeveloperHero() {
  return (
    <section className={`${mSection} smohix-developer-page-hero smohix-spatial-grid relative overflow-x-clip`}>
      <div className={mContainer}>
        <div className="smohix-developer-page-hero__opening">
          <SmohixHorizon className="max-w-md" />
          <p className={`mt-3 ${mSystemMeta} text-muted/75`}>
            {SITE_COMPANY_NAME} HQ · programmable surface
          </p>
        </div>
        <p className={`${mEyebrow} mt-8 text-accent/80`}>Developer platform</p>
        <h1 className={`mt-2 ${mH1}`}>Build secure integrations with Smohix</h1>
        <p className={mLede}>
          Use the same-origin HTTP API, API keys, and documented ingest paths to connect operational
          workflows — without inventing endpoints or exposing private backends in the browser.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <TrackableLink href="/docs/api" event="developer_quick_start" className={mFocusRing}>
            <Button size="lg">Read API documentation</Button>
          </TrackableLink>
          <TrackableLink
            href="/auth/sign-in?next=/settings/api-keys"
            event="developer_quick_start"
            className={mFocusRing}
          >
            <Button size="lg" variant="secondary">
              Manage API keys
            </Button>
          </TrackableLink>
          <TrackableLink href="/platform" event="developer_quick_start" className={mFocusRing}>
            <Button size="lg" variant="secondary">
              Platform overview
            </Button>
          </TrackableLink>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/docs" className={mLinkInline}>
            Docs hub →
          </Link>
          <Link href="/playground" className={mLinkInline}>
            Request builder →
          </Link>
          <Link href="/status" className={mLinkInline}>
            Status →
          </Link>
          <Link href="/security" className={mLinkInline}>
            Security →
          </Link>
        </div>
        <p className={`mt-4 ${mBody} text-muted/80`}>
          Products = ecosystem · Platform = operating core · Developers = programmable surface. API
          keys live at Settings → API keys after sign-in (secret shown once).
        </p>
        <nav
          className="smohix-developer-page-hero__nav mt-8 flex flex-wrap gap-x-4 gap-y-2"
          aria-label="Developer destinations"
        >
          {DEVELOPER_NAV.map((item) =>
            "external" in item && item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted transition-colors hover:text-accent"
              >
                {item.label} ↗
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </section>
  );
}
