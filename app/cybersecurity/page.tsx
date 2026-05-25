import type { Metadata } from "next";
import Link from "next/link";

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
    body: "Map services, dependencies, and critical paths. Know what is exposed before red teams or threat actors enumerate it.",
    href: "/auth/sign-in?next=/services",
  },
  {
    id: "exposure",
    title: "Exposure & certificate hygiene",
    body: "Track TLS certificates, secret rotation schedules, and configuration drift across network assets.",
    href: "/auth/sign-in?next=/assets/certificates",
  },
  {
    id: "pentest",
    title: "Penetration test command",
    body: "Scope exercises, record findings, and promote remediations through dry-runs and approval gates — no unlogged shell access.",
    href: "/auth/sign-in?next=/automations",
  },
  {
    id: "access",
    title: "Identity & access posture",
    body: "Snapshot MFA coverage, policy rules, and high-risk access paths. Block critical changes without senior acknowledgement.",
    href: "/auth/sign-in?next=/governance/access",
  },
  {
    id: "network",
    title: "Network defense & drift",
    body: "Device inventory, config snapshots, and drift findings — tie anomalies to incidents and remediation playbooks.",
    href: "/auth/sign-in?next=/assets/network",
  },
  {
    id: "respond",
    title: "Incident & breach response",
    body: "Correlate alerts into incidents, attach runbooks, execute guarded containment, and export audit-grade evidence.",
    href: "/auth/sign-in?next=/incidents",
  },
] as const;

export default function CybersecurityPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="zentro-hero-future border-b border-white/[0.06]">
          <article className={`${mArticle} max-w-4xl`}>
            <p className={`${mEyebrow} zentro-eyebrow-cyber`}>Security operations</p>
            <h1 className={`mt-2 shynvo-headline ${mH1}`}>
              Cybersecurity command for teams that cannot afford blind automation
            </h1>
            <p className={`mt-4 ${mBody} text-base sm:text-lg`}>
              {SITE_BRAND_NAME} extends beyond incident tickets: it is the control plane where
              detection, scanning, penetration workflows, and remediation meet — always with human
              authorization and a durable audit trail.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/auth/sign-in?next=/hub"
                className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-background"
              >
                Open security workspace
              </Link>
              <Link
                href="/enterprise"
                className="inline-flex h-10 items-center rounded-lg border border-white/[0.12] px-4 text-sm font-medium hover:border-accent/35"
              >
                Enterprise options
              </Link>
            </div>
          </article>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className={mH2}>Security capabilities</h2>
          <p className={`mt-2 ${mBody}`}>
            Each capability maps to console routes you can enable today. Advanced scanning depth
            grows with your connectors and policy configuration.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {capabilities.map((cap) => (
              <Link
                key={cap.id}
                id={cap.id}
                href={cap.href}
                className={`${mCard} block scroll-mt-24 no-underline`}
              >
                <h3 className={mCardTitle}>{cap.title}</h3>
                <p className={`mt-2 ${mBody}`}>{cap.body}</p>
                <span className="mt-3 inline-block text-sm text-accent">Open in console →</span>
              </Link>
            ))}
          </div>

          <section className="zentro-holo-panel mt-12 p-6 sm:p-8" aria-labelledby="soc-heading">
            <h2 id="soc-heading" className={mH2}>
              How SOC teams use Zentro
            </h2>
            <ol className={`mt-4 list-decimal space-y-3 pl-5 ${mBody}`}>
              <li>Ingest alerts via HTTP tokens or Datadog-shaped webhooks — deduped by external ref.</li>
              <li>Correlate to services and dependencies; score change risk before any remediation.</li>
              <li>Run penetration or containment playbooks in dry-run; require approval for production.</li>
              <li>Export timeline + audit events for post-incident review and regulatory requests.</li>
            </ol>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
