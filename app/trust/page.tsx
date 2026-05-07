import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { mArticle, mBody, mCard, mH1, mH2, mPanelShell } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME, SITE_PRIMARY_DOMAIN } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Trust & governance",
  description: `Audit, approvals, connectors, API access, execution posture, and rate limits — how ${SITE_BRAND_NAME} is designed for review.`,
};

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

export default function TrustPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <article className={mArticle}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90">Trust</p>
          <h1 className={`mt-2 ${mH1}`}>Trust &amp; governance</h1>
          <p className={`mt-4 ${mBody}`}>
            {SITE_BRAND_NAME} is built for teams that are accountable for operational changes. This
            page summarizes the control surfaces and commitments customers can rely on.
          </p>

          <section className="mt-12 space-y-4" aria-labelledby="pillars-heading">
            <h2 id="pillars-heading" className={mH2}>
              Control surfaces
            </h2>
            <p className={mBody}>
              Each block below maps to a signed-in route. Read the full narrative on the{" "}
              <Link href="/platform" className="font-medium text-accent hover:underline">
                platform overview
              </Link>
              .
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {PILLARS.map((p) => (
                <li key={p.title} className={mCard}>
                  <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className={`mt-2 ${mBody}`}>{p.body}</p>
                  <Link
                    href={p.href}
                    className="mt-4 inline-block text-xs font-semibold text-accent hover:underline"
                  >
                    {p.cta} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12" aria-labelledby="execution-heading">
            <h2 id="execution-heading" className={mH2}>
              Operational execution posture
            </h2>
            <p className={`mt-3 ${mBody}`}>
              The product is designed for review-first operations: dry-run and approval workflows for
              high-impact actions, with auditable records of approved execution paths.
            </p>
          </section>

          <section className="mt-12" aria-labelledby="limits-heading">
            <h2 id="limits-heading" className={mH2}>
              Availability and abuse resistance
            </h2>
            <p className={`mt-3 ${mBody}`}>
              Public and sensitive routes are protected with authentication boundaries and request
              controls designed to reduce abuse and preserve service availability.
            </p>
            <div className={`mt-6 p-5 ${mPanelShell}`}>
              <p className={`text-sm font-medium text-foreground`}>Customers can expect</p>
              <ul className={`mt-3 list-inside list-disc space-y-2 ${mBody}`}>
                <li>Explicit authentication for user APIs and alert ingest</li>
                <li>Audit-focused operational records for key platform actions</li>
                <li>Clear separation between evaluation mode and production-backed workspaces</li>
              </ul>
            </div>
          </section>

          <section className="mt-12" aria-labelledby="disclosure-heading">
            <h2 id="disclosure-heading" className={mH2}>
              Security communication
            </h2>
            <p className={`mt-3 ${mBody}`}>
              For security disclosures, data handling questions, and procurement review requests,
              contact support via <a href={`https://${SITE_PRIMARY_DOMAIN}`}>{SITE_PRIMARY_DOMAIN}</a>{" "}
              channels. Customer-specific architecture and implementation details are shared through
              authenticated support and enterprise review workflows.
            </p>
          </section>

          <p className={`mt-12 flex flex-wrap gap-x-4 gap-y-2 ${mBody}`}>
            <Link href="/why" className="font-medium text-accent hover:underline">
              Why {SITE_BRAND_NAME} →
            </Link>
            <Link href="/" className="font-medium text-accent hover:underline">
              ← Home
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
