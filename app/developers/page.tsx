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
  DEVELOPER_CAPABILITIES,
  DEVELOPER_ERROR_HANDLING,
  DEVELOPER_EXAMPLE,
  DEVELOPER_NAV,
  DEVELOPER_QUICK_START,
  DEVELOPER_RATE_LIMITS,
  DEVELOPER_SDKS,
  DEVELOPER_SECURITY_GUIDANCE,
  DEVELOPER_VERSIONING,
  sdkStatusLabel,
} from "@/lib/developer-journey";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mH3, mSection } from "@/lib/marketing-layout";
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
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Developer Platform</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Build secure integrations with Smohix
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>
              Use the same-origin HTTP API, API keys, and documented ingest paths to connect
              operational workflows — without inventing endpoints or exposing private backends in
              the browser.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackableLink href="/docs/api" event="developer_quick_start">
                <Button>Read API documentation</Button>
              </TrackableLink>
              <TrackableLink href="/auth/sign-in?next=/settings/api-keys" event="developer_quick_start">
                <Button variant="secondary">Manage API keys</Button>
              </TrackableLink>
              <TrackableLink href="/platform" event="developer_quick_start">
                <Button variant="secondary">Platform overview</Button>
              </TrackableLink>
            </div>
            <nav
              className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.06] pt-6"
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

        <section className={mSection} aria-labelledby="capabilities-heading">
          <div className={mContainer}>
            <h2 id="capabilities-heading" className={mH3}>
              What you can build today
            </h2>
            <p className={`mt-2 max-w-2xl ${mBody}`}>
              Capabilities below map to routes and settings that already exist in this repository.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEVELOPER_CAPABILITIES.map((cap) => (
                <li key={cap.title}>
                  <Link
                    href={cap.href}
                    className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-[border-color] hover:border-accent/30"
                  >
                    <h3 className="text-base font-semibold text-foreground">{cap.title}</h3>
                    <p className={`mt-2 flex-1 ${mBody}`}>{cap.description}</p>
                    <span className="mt-4 text-xs font-semibold text-accent">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${mSection} border-t border-white/[0.06]`} aria-labelledby="quickstart-heading">
          <div className={mContainer}>
            <h2 id="quickstart-heading" className={mH3}>
              Quick start
            </h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <section className={mSection} aria-labelledby="example-heading">
          <div className={mContainer}>
            <h2 id="example-heading" className={mH3}>
              First authenticated request
            </h2>
            <p className={`mt-2 max-w-2xl ${mBody}`}>
              Example uses a clearly fake key prefix. Replace with a secret from Settings → API keys.
              API keys authenticate the reasoning and robot proxies — not every console route.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/40 p-4 text-xs leading-relaxed text-foreground/90">
              <code>{DEVELOPER_EXAMPLE}</code>
            </pre>
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
              <h2 className={mH3}>Errors &amp; rate limits</h2>
              <ul className={`mt-4 list-inside list-disc space-y-2 ${mBody}`}>
                {DEVELOPER_ERROR_HANDLING.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className={`mt-4 ${mBody}`}>{DEVELOPER_RATE_LIMITS.body}</p>
            </div>
          </div>
        </section>

        <section className={mSection} aria-labelledby="security-heading">
          <div className={mContainer}>
            <h2 id="security-heading" className={mH3}>
              Secure integration
            </h2>
            <ul className={`mt-4 list-inside list-disc space-y-2 ${mBody}`}>
              {DEVELOPER_SECURITY_GUIDANCE.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/security" className="text-sm font-medium text-accent hover:underline">
                Security →
              </Link>
              <Link href="/trust" className="text-sm font-medium text-accent hover:underline">
                Trust →
              </Link>
              <Link href="/status" className="text-sm font-medium text-accent hover:underline">
                Status →
              </Link>
            </div>
          </div>
        </section>

        <section className={`${mSection} border-t border-white/[0.06]`}>
          <div className={mContainer}>
            <h2 className={mH3}>SDK &amp; CLI status</h2>
            <p className={`mt-2 max-w-2xl ${mBody}`}>
              Only statuses below are claimed. Preview and planned items are not published packages.
            </p>
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
            <p className={`mt-4 ${mBody}`}>{DEVELOPER_VERSIONING.body}</p>
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
              Open Smohix AI ↗
            </a>
          </div>
        </section>

        <section className={mSection}>
          <div className={mContainer}>
            <h2 className={mH3}>API request builder</h2>
            <p className={`mt-2 max-w-2xl ${mBody}`}>
              Copy example requests for documented routes — run them in your terminal or server.
              Requests are not executed from this page.
            </p>
            <div className="mt-6">
              <ApiRequestBuilder />
            </div>
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
              <Link href="/docs" className="text-sm font-medium text-accent hover:underline">
                Docs hub →
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
