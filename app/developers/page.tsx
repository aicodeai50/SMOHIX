import type { Metadata } from "next";
import Link from "next/link";

import { ApiRequestBuilder } from "@/components/developers/ApiRequestBuilder";
import { CommercialPaths } from "@/components/marketing/CommercialPaths";
import { TrackableLink } from "@/components/marketing/TrackableLink";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { MarketingJsonLd, developersPageJsonLd } from "@/components/site/MarketingJsonLd";
import { Button } from "@/components/ui/Button";
import {
  DEVELOPER_AI_NOTE,
  DEVELOPER_AUTH,
  DEVELOPER_BILLING,
  DEVELOPER_ERROR_HANDLING,
  DEVELOPER_EXAMPLE,
  DEVELOPER_QUICK_START,
  DEVELOPER_SDKS,
  sdkStatusLabel,
} from "@/lib/developer-journey";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mH3, mSection } from "@/lib/marketing-layout";
import { SITE_PUBLIC_BRAND } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Developers",
  description: `Build on ${SITE_PUBLIC_BRAND} — API catalog, authentication, SDK status, examples, and integration guides.`,
  path: "/developers",
});

const DEV_LINKS = [
  { href: "/products", title: "Product Access", description: "Open live Zentro products and documentation." },
  { href: "/playground", title: "API request builder", description: "Copyable curl and SDK examples — not executed in browser." },
  { href: "/docs", title: "Documentation", description: "Guides for setup, console modules, and deployment." },
  { href: "/docs/api", title: "API reference", description: "Catalog of public and authenticated API routes." },
  { href: "/integrations", title: "Integrations", description: "Alert ingest, Slack approvals, and connector health." },
  {
    href: "https://github.com/aicodeai50/ZENTRO",
    title: "GitHub",
    description: "Open-source web application and migration scripts.",
    external: true,
  },
] as const;

export default function DevelopersPage() {
  return (
    <>
      <MarketingJsonLd graph={developersPageJsonLd()} />
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Build with Zentro</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Developer hub
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>
              Same-origin APIs, documented routes, and API keys — integrate without exposing
              private Railway URLs in the browser.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackableLink href="/docs/api" event="developer_quick_start">
                <Button>API reference</Button>
              </TrackableLink>
              <TrackableLink href="/auth/sign-in?next=/settings/api-keys" event="developer_quick_start">
                <Button variant="secondary">Get API keys</Button>
              </TrackableLink>
              <TrackableLink href="/contact?inquiry=developer&product=api" event="developer_access_request">
                <Button variant="secondary">Request developer access</Button>
              </TrackableLink>
            </div>
          </div>
        </section>

        <section className={mSection} aria-labelledby="quickstart-heading">
          <div className={mContainer}>
            <h2 id="quickstart-heading" className={mH3}>
              Quick start
            </h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {DEVELOPER_QUICK_START.map((step) => (
                <li
                  key={step.step}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
                >
                  <TrackableLink
                    href={step.href}
                    event="developer_quick_start"
                    className="font-semibold text-foreground hover:text-accent"
                  >
                    {step.step}
                  </TrackableLink>
                  <p className={`mt-2 ${mBody}`}>{step.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${mSection} border-t border-white/[0.06]`}>
          <div className={`${mContainer} grid gap-5 sm:grid-cols-2`}>
            {DEV_LINKS.map((link) =>
              "external" in link && link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-[border-color] hover:border-accent/30"
                >
                  <h2 className="text-lg font-semibold text-foreground">{link.title}</h2>
                  <p className={`mt-2 ${mBody}`}>{link.description}</p>
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-[border-color] hover:border-accent/30"
                >
                  <h2 className="text-lg font-semibold text-foreground">{link.title}</h2>
                  <p className={`mt-2 ${mBody}`}>{link.description}</p>
                </Link>
              ),
            )}
          </div>
        </section>

        <section className={mSection}>
          <div className={mContainer}>
            <h2 className={mH3}>SDK &amp; CLI overview</h2>
            <ul className="mt-6 space-y-3">
              {DEVELOPER_SDKS.map((sdk) => (
                <li
                  key={sdk.name}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{sdk.name}</p>
                    <p className={`mt-1 text-sm ${mBody}`}>{sdk.detail}</p>
                  </div>
                  <span className="rounded-full border border-white/[0.12] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {sdkStatusLabel(sdk.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${mSection} border-t border-white/[0.06]`}>
          <div className={mContainer}>
            <h2 className={mH3}>{DEVELOPER_AI_NOTE.title}</h2>
            <p className={`mt-3 max-w-2xl ${mBody}`}>{DEVELOPER_AI_NOTE.body}</p>
            <a
              href={DEVELOPER_AI_NOTE.href}
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Zentro AI ↗
            </a>
          </div>
        </section>

        <section className={`${mSection} border-t border-white/[0.06]`}>
          <div className={`${mContainer} grid gap-10 lg:grid-cols-2`}>
            <div>
              <h2 className={mH3}>{DEVELOPER_AUTH.title}</h2>
              <ul className={`mt-4 list-inside list-disc space-y-2 ${mBody}`}>
                {DEVELOPER_AUTH.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className={mH3}>Error handling</h2>
              <ul className={`mt-4 list-inside list-disc space-y-2 ${mBody}`}>
                {DEVELOPER_ERROR_HANDLING.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={mSection}>
          <div className={mContainer}>
            <h2 className={mH3}>API request builder</h2>
            <p className={`mt-2 max-w-2xl ${mBody}`}>
              Copy example requests for documented routes — run them in your terminal or server.
            </p>
            <div className="mt-6">
              <ApiRequestBuilder />
            </div>
          </div>
        </section>

        <section className={`${mSection} border-t border-white/[0.06]`}>
          <div className={mContainer}>
            <h2 className={mH3}>Example request</h2>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/40 p-4 text-xs leading-relaxed text-foreground/90">
              <code>{DEVELOPER_EXAMPLE}</code>
            </pre>
          </div>
        </section>

        <section className={`${mSection} border-t border-white/[0.06]`}>
          <div className={mContainer}>
            <h2 className={mH3}>{DEVELOPER_BILLING.title}</h2>
            <p className={`mt-3 max-w-2xl ${mBody}`}>{DEVELOPER_BILLING.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/pricing" className="text-sm font-medium text-accent hover:underline">
                Pricing →
              </Link>
              <Link href="/status" className="text-sm font-medium text-accent hover:underline">
                Status →
              </Link>
              <Link href="/changelog" className="text-sm font-medium text-accent hover:underline">
                Changelog →
              </Link>
            </div>
          </div>
        </section>

        <section className={`${mSection} pb-16`}>
          <div className={mContainer}>
            <CommercialPaths compact />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
