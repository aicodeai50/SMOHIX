import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { mArticle, mBody, mCard, mH1, mH2 } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Changelog",
  description: `Recent ${SITE_BRAND_NAME} product and marketing updates.`,
};

const ENTRIES: { date: string; title: string; bullets: string[] }[] = [
  {
    date: "Jun 2026",
    title: "Professional product cleanup",
    bullets: [
      "Public homepage simplified around incident command, guarded automation, evidence, pricing, and CTA",
      "Integration page now separates available HTTP/webhook paths from planned native vendor connectors",
      "Console navigation reduced to core workflows with maturity labels for beta surfaces",
    ],
  },
  {
    date: "Jun 2026",
    title: "Incident command and enterprise foundations",
    bullets: [
      "Incident assignees, command events, handoffs, notifications, and incident-scoped Copilot context",
      "Org-scoped billing, API keys, ingest tokens, Copilot threads, and integration connection records",
      "Deploy event ingest, automation policy versions, and remediation execution receipts",
    ],
  },
  {
    date: "May 2026",
    title: "Governance and audit evidence expansion",
    bullets: [
      "Compliance evidence bundles, assessor exports, framework mappings, retention controls, and legal hold support",
      "Organization RBAC, org-scoped audit rows, and auditor read-only workspace support",
      "Representative SOC 2, ISO 27001, PCI, HIPAA, NIST CSF, CIS, CMMC, and GDPR control packs",
    ],
  },
  {
    date: "May 2026",
    title: "Security operations depth",
    bullets: [
      "Service catalog, SLO context, vulnerability ingest, exposure priority, pen-test rollups, and attack-path simulation from catalog data",
      "HTTP alert ingest normalizes common monitoring, paging, SIEM, and EDR payload shapes",
      "Guarded remediation flows connect incidents, approvals, dry-runs, and audit evidence",
    ],
  },
  {
    date: "May 2026",
    title: "Production hardening",
    bullets: [
      "Distributed rate limiting with Upstash fallback, structured logs, optional Sentry capture, and release verification scripts",
      "Copilot access checks, fallback replies, thread persistence, and migration consistency checks",
      "Railway-ready release flow with lint, TypeScript, migration bundle checks, and Next.js build verification",
    ],
  },
  {
    date: "April 2026",
    title: "Core console, API docs, and positioning",
    bullets: [
      "Incident, overview, automations, audit, approvals, services, Copilot, runbooks, and hub console pages",
      "Public API documentation, pricing, platform overview, status, and buyer-facing product pages",
      "Health endpoint hardening, alert ingest extensions, and route-level loading/empty states",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className={mArticle}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90">
            {SITE_BRAND_NAME}
          </p>
          <h1 className={`mt-2 ${mH1}`}>Changelog</h1>
          <p className={`mt-4 ${mBody}`}>
            High-level shipped work — not every commit. For source history, use the GitHub
            repository.
          </p>
          <ol className="mt-10 space-y-6">
            {ENTRIES.map((e) => (
              <li key={e.title} className={mCard}>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent/90">{e.date}</p>
                <h2 className={`mt-2 ${mH2}`}>{e.title}</h2>
                <ul className={`mt-4 list-inside list-disc space-y-2 ${mBody}`}>
                  {e.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p className={`mt-14 ${mBody}`}>
            <Link href="/" className="font-medium text-accent hover:underline">
              ← Home
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
