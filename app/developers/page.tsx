import type { Metadata } from "next";
import Link from "next/link";

import { CodeSurface } from "@/components/architecture";
import { ApiRequestBuilder } from "@/components/developers/ApiRequestBuilder";
import { DeveloperCoreField } from "@/components/developers/DeveloperCoreField";
import { DeveloperHero } from "@/components/developers/DeveloperHero";
import { CommercialPaths } from "@/components/marketing/CommercialPaths";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MarketingJsonLd, developersPageJsonLd } from "@/components/site/MarketingJsonLd";
import {
  DEVELOPER_AI_NOTE,
  DEVELOPER_BILLING,
  DEVELOPER_ERROR_HANDLING,
  DEVELOPER_EXAMPLE,
} from "@/lib/developer-journey";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mBodySm, mContainer, mH3, mSection } from "@/lib/marketing-layout";
import { SITE_PUBLIC_BRAND } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Developers",
  description: `Build on ${SITE_PUBLIC_BRAND} — API documentation, API keys, integrations, and secure operational workflows.`,
  path: "/developers",
});

export default function DevelopersPage() {
  return (
    <>
      <MarketingJsonLd graph={developersPageJsonLd()} />
      <Header />
      <main id="main-content" className="flex-1">
        <DeveloperHero />

        <MarketingReveal className={`${mSection} border-t border-white/[0.06]`}>
          <div className={mContainer}>
            <DeveloperCoreField />
          </div>
        </MarketingReveal>

        <MarketingReveal className={`${mSection} border-t border-white/[0.06]`} aria-labelledby="example-heading">
          <div className={mContainer}>
            <h2 id="example-heading" className={mH3}>
              First authenticated request
            </h2>
            <p className={`mt-2 max-w-2xl ${mBody}`}>
              Example uses a clearly fake key prefix. Replace with a secret from Settings → API keys.
              API keys authenticate the reasoning and robot proxies — not every console route.
            </p>
            <CodeSurface label="HTTP example · server-side only" className="mt-6">
              <pre>
                <code>{DEVELOPER_EXAMPLE}</code>
              </pre>
            </CodeSurface>
            <div className="mt-6 smohix-developer-error-band">
              <p className={`${mBodySm} font-medium text-foreground/90`}>Errors &amp; rate limits</p>
              <ul className={`mt-2 list-inside list-disc space-y-1 ${mBodySm} text-muted/85`}>
                {DEVELOPER_ERROR_HANDLING.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </MarketingReveal>

        <MarketingReveal className={`${mSection} border-t border-white/[0.06]`}>
          <div className={mContainer}>
            <div className="smohix-developer-ai-boundary">
              <h2 className={mH3}>{DEVELOPER_AI_NOTE.title}</h2>
              <p className={`mt-3 max-w-2xl ${mBody}`}>{DEVELOPER_AI_NOTE.body}</p>
              <a
                href={DEVELOPER_AI_NOTE.href}
                className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Smohix AI ↗
              </a>
            </div>
          </div>
        </MarketingReveal>

        <MarketingReveal className={mSection}>
          <div className={mContainer}>
            <h2 className={mH3}>API request builder</h2>
            <p className={`mt-2 max-w-2xl ${mBody}`}>
              Copy example requests for documented routes — run them in your terminal or server.
              Requests are not executed from this page.
            </p>
            <p className={`mt-2 ${mBodySm}`}>
              <Link href="/playground" className="font-medium text-accent hover:underline">
                Open full request builder →
              </Link>
            </p>
            <div className="mt-6">
              <ApiRequestBuilder />
            </div>
          </div>
        </MarketingReveal>

        <MarketingReveal className={`${mSection} border-t border-white/[0.06]`}>
          <div className={mContainer}>
            <h2 className={mH3}>{DEVELOPER_BILLING.title}</h2>
            <p className={`mt-3 max-w-2xl ${mBody}`}>{DEVELOPER_BILLING.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pricing" className="text-sm font-medium text-accent hover:underline">
                Pricing →
              </Link>
              <Link href="/docs" className="text-sm font-medium text-accent hover:underline">
                Docs hub →
              </Link>
              <Link href="/changelog" className="text-sm font-medium text-accent hover:underline">
                Changelog →
              </Link>
            </div>
          </div>
        </MarketingReveal>

        <MarketingReveal className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <CommercialPaths compact />
          </div>
        </MarketingReveal>
      </main>
      <Footer />
    </>
  );
}
