import type { Metadata } from "next";
import Link from "next/link";

import { DimensionGate } from "@/components/landing/DimensionGate";
import { LivingPulse } from "@/components/landing/LivingPulse";
import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { mArticle, mBody, mCard, mCardTitle, mEyebrow, mH1, mH2 } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Cybersecurity",
  description:
    "Threat surface, exposure scanning, penetration workflows, and guarded remediation — unified in the Zentro command platform.",
};

const capabilities = [
  {
    id: "surface",
    title: "Attack surface intelligence",
    body: "Map service manifolds and critical paths before threat actors enumerate your perimeter.",
    href: "/auth/sign-in?next=/services",
  },
  {
    id: "exposure",
    title: "Exposure & certificate hygiene",
    body: "Track TLS decay, secret rotation, and config drift across the network lattice.",
    href: "/auth/sign-in?next=/assets/certificates",
  },
  {
    id: "pentest",
    title: "Penetration test command",
    body: "Scope exercises, record findings, promote remediations through dry-runs — no unlogged shell access.",
    href: "/auth/sign-in?next=/automations",
  },
  {
    id: "access",
    title: "Identity & access posture",
    body: "Snapshot MFA coverage and high-risk paths. Block critical changes without senior acknowledgement.",
    href: "/auth/sign-in?next=/governance/access",
  },
  {
    id: "network",
    title: "Network defense & drift",
    body: "Device inventory, config snapshots, drift findings — tie anomalies to incidents and playbooks.",
    href: "/auth/sign-in?next=/assets/network",
  },
  {
    id: "respond",
    title: "Incident & breach response",
    body: "Collapse alerts into incidents, attach runbooks, execute guarded containment, export audit evidence.",
    href: "/auth/sign-in?next=/incidents",
  },
] as const;

export default function CybersecurityPage() {
  return (
    <>
      <Header />
      <MarketingQuantumShell>
        <main className="flex-1 border-b border-white/[0.06]">
          <div className="zentro-hero-future zentro-quantum-section border-b border-white/[0.06]">
            <article className={`${mArticle} max-w-4xl`}>
              <LivingPulse />
              <p className={`${mEyebrow} zentro-eyebrow-cyber`}>⟡ Security dimension</p>
              <h1 className={`mt-2 shynvo-headline zentro-living-headline ${mH1}`}>
                Cyber defense that breathes with your perimeter
              </h1>
              <p className={`mt-4 ${mBody} text-base sm:text-lg`}>
                {SITE_BRAND_NAME} is not another ticket queue — it is a living security manifold where
                detection, scanning, penetration workflows, and remediation converge with human
                authorization and durable audit coherence.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth/sign-in?next=/hub"
                  className="zentro-launch-beacon inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-background"
                >
                  Enter security workspace
                </Link>
                <Link
                  href="/enterprise"
                  className="inline-flex h-10 items-center rounded-lg border border-white/[0.12] px-4 text-sm font-medium hover:border-accent/35"
                >
                  Enterprise dimension
                </Link>
              </div>
            </article>
          </div>

          <DimensionGate />

          <div className="zentro-quantum-section mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className={`zentro-living-headline ${mH2}`}>Security capabilities</h2>
            <p className={`mt-2 ${mBody}`}>
              Each capability maps to live console routes. Scanning depth grows with your connectors
              and policy lattice.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {capabilities.map((cap) => (
                <Link
                  key={cap.id}
                  id={cap.id}
                  href={cap.href}
                  className={`zentro-bento-cell ${mCard} block scroll-mt-24 no-underline`}
                >
                  <h3 className={mCardTitle}>{cap.title}</h3>
                  <p className={`mt-2 ${mBody}`}>{cap.body}</p>
                  <span className="mt-3 inline-block text-sm text-accent">Open in console →</span>
                </Link>
              ))}
            </div>

            <section
              className="zentro-quantum-core zentro-holo-panel mt-12 p-6 sm:p-8"
              aria-labelledby="soc-heading"
            >
              <h2 id="soc-heading" className={`zentro-living-headline ${mH2}`}>
                How SOC teams use the living command layer
              </h2>
              <ol className={`mt-4 list-decimal space-y-3 pl-5 ${mBody}`}>
                <li>Ingest alerts via HTTP tokens or Datadog-shaped webhooks — deduped by external ref.</li>
                <li>Correlate to services and dependencies; score change risk before remediation.</li>
                <li>Run containment playbooks in dry-run; require approval for production.</li>
                <li>Export timeline + audit events for post-incident review and regulatory requests.</li>
              </ol>
            </section>
          </div>
        </main>
      </MarketingQuantumShell>
      <Footer />
    </>
  );
}
