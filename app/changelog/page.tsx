import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Recent Shynvo product and marketing updates.",
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
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Changelog
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            High-level shipped work — not every commit. For source history, use the GitHub
            repository.
          </p>
          <ol className="mt-10 space-y-12">
            {ENTRIES.map((e) => (
              <li key={e.title}>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent/90">{e.date}</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{e.title}</h2>
                <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
                  {e.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p className="mt-14 text-sm">
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
