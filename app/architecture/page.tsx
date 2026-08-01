import type { Metadata } from "next";
import Link from "next/link";

import { ArchitectureDiagram } from "@/components/architecture/ArchitectureDiagram";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { buildMarketingMetadata } from "@/lib/metadata";
import { mBody, mContainer, mEyebrow, mSection } from "@/lib/marketing-layout";
import { SITE_COMPANY_NAME } from "@/lib/site-brand";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Architecture",
  description: `How ${SITE_COMPANY_NAME} connects users, frontend, platform, AI gateway, providers, storage, and infrastructure.`,
  path: "/architecture",
});

const FLOW_NOTES = [
  {
    title: "Same-origin trust boundary",
    body: "The browser talks only to zentro.run. API keys and private Railway URLs stay on the server.",
  },
  {
    title: "Platform as hub",
    body: "Incidents, automations, Copilot, and billing modules share Supabase identity and audit context.",
  },
  {
    title: "Optional backends",
    body: "Reasoning, robot, and Own API services connect via env-configured proxies — not hard-coded secrets in this repo.",
  },
] as const;

export default function ArchitecturePage() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className={`${mSection} border-b border-white/[0.06]`}>
          <div className={mContainer}>
            <p className={`${mEyebrow} text-primary-muted`}>Platform</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              System architecture
            </h1>
            <p className={`mt-4 max-w-2xl ${mBody}`}>
              One intelligent platform — from operators in the browser to private services on Railway.
              Every layer is a capability, not a separate product silo.
            </p>
          </div>
        </section>

        <section className={mSection} aria-labelledby="diagram-heading">
          <div className={mContainer}>
            <h2 id="diagram-heading" className="sr-only">
              Architecture diagram
            </h2>
            <ArchitectureDiagram />
          </div>
        </section>

        <section className={`${mSection} border-t border-white/[0.06] bg-white/[0.01]`}>
          <div className={`${mContainer} grid gap-6 md:grid-cols-3`}>
            {FLOW_NOTES.map((note) => (
              <article
                key={note.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <h3 className="font-semibold text-foreground">{note.title}</h3>
                <p className={`mt-2 ${mBody}`}>{note.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${mSection} pb-16`}>
          <div className={`${mContainer} flex flex-wrap gap-3`}>
            <Link
              href="/technology"
              className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40"
            >
              Technology stack →
            </Link>
            <Link
              href="/#ecosystem"
              className="rounded-lg border border-white/[0.12] px-4 py-2 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/40"
            >
              Ecosystem map →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
