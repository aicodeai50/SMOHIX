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
    date: "April 2026",
    title: "Console UX and API docs",
    bullets: [
      "Route-level loading skeletons (incidents, overview, automations, audit, approvals, services, copilot, runbooks, hub, vision, new incident, runbook detail)",
      "Richer empty states (incidents, audit, services catalog, approvals) with guided CTAs",
      "Public /docs/api catalog + OpenAPI sketch from lib/docs/api-catalog",
    ],
  },
  {
    date: "April 2026",
    title: "Positioning and buyer narrative",
    bullets: [
      "Public /platform overview — flow, guarded model, capabilities, differentiation, architecture",
      "Learn hub at /docs, /why philosophy page, /pricing, /status, /changelog",
      "Homepage: product preview strip, mechanics grid, use cases, control section",
    ],
  },
  {
    date: "April 2026",
    title: "Incidents and operations depth",
    bullets: [
      "Incident owner hint, runbook slug, markdown export API",
      "Health endpoint optional deploy commit",
      "Alert ingest payload extensions",
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
