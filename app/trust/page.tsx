import type { Metadata } from "next";
import Link from "next/link";

import { CommercialPaths } from "@/components/marketing/CommercialPaths";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { TrustStatusBadge } from "@/components/marketing/TrustStatusBadge";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getMailtoHref } from "@/lib/billing";
import { buildMarketingMetadata } from "@/lib/metadata";
import {
  TRUST_AI,
  TRUST_MATURITY,
  TRUST_NOT_CLAIMED,
  TRUST_PRIVACY,
  TRUST_SECURITY,
} from "@/lib/trust-center";
import { mArticle, mBody, mCard, mEyebrow, mH1, mH2, mH3, mLinkInline, mStaggerGrid } from "@/lib/marketing-layout";
import { SITE_PUBLIC_BRAND } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Trust Center",
  description: `Security, privacy, responsible AI, and product maturity disclosure for ${SITE_PUBLIC_BRAND} — truthful commitments only.`,
  path: "/trust",
});

const PILLARS = [
  {
    title: "Audit trail",
    body: "Operational events — API keys, billing webhooks, approvals, automation activity — are designed to land in one append-oriented log you can export and walk through with auditors.",
    href: "/auth/sign-in?next=/audit",
    cta: "Audit log",
  },
  {
    title: "Approvals",
    body: "High-impact automation waits for an explicit approval record before execution. The queue is a first-class route, not a side channel.",
    href: "/auth/sign-in?next=/approvals",
    cta: "Approvals",
  },
  {
    title: "Connectors",
    body: "Optional HTTP backends for reasoning, robot-style automation, and health checks. Nothing runs against your stack until you configure endpoints and credentials.",
    href: "/auth/sign-in?next=/settings/connectors",
    cta: "Connectors",
  },
  {
    title: "API access & keys",
    body: "Scripts and integrations authenticate with scoped keys. Keys are created and rotated from Settings; usage flows through the same-origin API surface documented in the reference.",
    href: "/auth/sign-in?next=/settings/api-keys",
    cta: "API keys",
  },
] as const;

function TrustItemList({
  title,
  items,
}: {
  title: string;
  items: readonly { title: string; body: string; status: "current" | "in-progress" | "planned" }[];
}) {
  return (
    <section aria-labelledby={title.replace(/\s/g, "-").toLowerCase()}>
      <h2 id={title.replace(/\s/g, "-").toLowerCase()} className={mH2}>
        {title}
      </h2>
      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item.title} className="smohix-surface smohix-surface--dormant p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className={`${mH3} text-base`}>{item.title}</h3>
              <TrustStatusBadge status={item.status} />
            </div>
            <p className={`mt-2 ${mBody}`}>{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function TrustPage() {
  return (
    <>
      <Header />
      <main className="smohix-trust-authority flex-1 border-b border-white/[0.06]">
        <article className={mArticle}>
          <MarketingReveal as="div">
            <p className={`${mEyebrow} text-accent/80`}>Trust center</p>
            <h1 className={`mt-2 ${mH1}`}>Trust &amp; governance</h1>
            <p className={`mt-4 ${mBody}`}>
              {SITE_PUBLIC_BRAND} is built for teams accountable for operational changes. This
              page states what is current, in progress, or planned — without unverified
              certification claims.
            </p>
          </MarketingReveal>

          <MarketingReveal as="div" className="mt-12">
            <h2 id="pillars-heading" className={mH2}>
              Control surfaces
            </h2>
            <ul className={`mt-6 grid gap-4 sm:grid-cols-2 ${mStaggerGrid}`}>
              {PILLARS.map((p) => (
                <li key={p.title} className={mCard}>
                  <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className={`mt-2 ${mBody}`}>{p.body}</p>
                  <Link href={p.href} className={`mt-4 inline-block text-xs ${mLinkInline}`}>
                    {p.cta} →
                  </Link>
                </li>
              ))}
            </ul>
          </MarketingReveal>

          <div className="mt-12 space-y-12">
            <TrustItemList title="Security principles" items={TRUST_SECURITY} />
            <TrustItemList title="Privacy principles" items={TRUST_PRIVACY} />
            <TrustItemList title="Responsible AI" items={TRUST_AI} />
          </div>

          <section className="mt-12" aria-labelledby="maturity-heading">
            <h2 id="maturity-heading" className={mH2}>
              {TRUST_MATURITY.title}
            </h2>
            <p className={`mt-3 ${mBody}`}>{TRUST_MATURITY.body}</p>
            <Link href="/products" className={`mt-4 inline-block text-sm ${mLinkInline}`}>
              View product maturity labels →
            </Link>
          </section>

          <section className="mt-12" aria-labelledby="not-claimed-heading">
            <h2 id="not-claimed-heading" className={mH2}>
              What we do not claim
            </h2>
            <ul className={`mt-4 list-inside list-disc space-y-1 ${mBody}`}>
              {TRUST_NOT_CLAIMED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mt-12" aria-labelledby="report-heading">
            <h2 id="report-heading" className={mH2}>
              Vulnerability reporting &amp; status
            </h2>
            <p className={`mt-3 ${mBody}`}>
              Report security issues via{" "}
              <a href={getMailtoHref("security")} className="text-accent hover:underline">
                security contact
              </a>
              . For runtime availability see{" "}
              <Link href="/status" className="text-accent hover:underline">
                service status
              </Link>
              . Read{" "}
              <Link href="/security" className="text-accent hover:underline">
                Security
              </Link>{" "}
              for disclosure expectations.
            </p>
          </section>

          <div className="mt-12">
            <CommercialPaths compact />
          </div>

          <p className={`mt-12 flex flex-wrap gap-x-4 gap-y-2 ${mBody}`}>
            <Link href="/privacy" className={mLinkInline}>
              Privacy →
            </Link>
            <Link href="/" className={mLinkInline}>
              ← Home
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
