import type { Metadata } from "next";
import Link from "next/link";

import { DimensionGate } from "@/components/landing/DimensionGate";
import { LivingPulse } from "@/components/landing/LivingPulse";
import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SITE_EMAIL_CONTACT, getMailtoHref } from "@/lib/billing";
import { mArticle, mBody, mCard, mCardTitle, mEyebrow, mH1, mH2 } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Enterprise",
  description:
    "Enterprise deployment for global platform and security teams — governance, evidence, and guarded operations at scale.",
};

const packages = [
  {
    title: "Global command plane",
    body: "Unified incidents, security posture, and automation across regions — one audit model, many environments.",
  },
  {
    title: "Security & compliance pack",
    body: "Retention policies, export APIs, webhook delivery logs, and procurement documentation for vendor review.",
  },
  {
    title: "MSSP & multi-tenant ready",
    body: "Per-user isolation with RLS today; org-scoped roles and delegated approvers for shared SOCs.",
  },
  {
    title: "White-glove onboarding",
    body: "Connector hardening, runbook import, and executive readouts for your first 90 days on the platform.",
  },
] as const;

export default function EnterprisePage() {
  const salesHref = getMailtoHref("enterprise");

  return (
    <>
      <Header />
      <MarketingQuantumShell>
        <main className="flex-1 border-b border-white/[0.06]">
          <div className="zentro-hero-future zentro-quantum-section border-b border-white/[0.06]">
            <article className={`${mArticle} max-w-4xl`}>
              <LivingPulse />
              <p className={`${mEyebrow} zentro-eyebrow-cyber`}>⟡ Enterprise</p>
              <h1 className={`mt-2 shynvo-headline zentro-living-headline ${mH1}`}>
                Operations and security at the scale your board expects
              </h1>
              <p className={`mt-4 ${mBody} text-base sm:text-lg`}>
                {SITE_BRAND_NAME} gives Fortune-scale platform, security, and reliability teams a
                unified operations layer — incidents, threat visibility, guarded change, and evidence
                that survives audits without replacing the tools you already trust.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={salesHref}
                  className="zentro-launch-beacon inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-background"
                >
                  Contact {SITE_EMAIL_CONTACT}
                </a>
                <Link
                  href="/cybersecurity"
                  className="inline-flex h-10 items-center rounded-lg border border-white/[0.12] px-4 text-sm font-medium hover:border-accent/35"
                >
                  Cybersecurity
                </Link>
              </div>
            </article>
          </div>

          <DimensionGate />

          <div className="zentro-quantum-section mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
            <h2 className={`zentro-living-headline ${mH2}`}>What enterprise includes</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {packages.map((pkg) => (
                <div key={pkg.title} className={`zentro-bento-cell ${mCard}`}>
                  <h3 className={mCardTitle}>{pkg.title}</h3>
                  <p className={`mt-2 ${mBody}`}>{pkg.body}</p>
                </div>
              ))}
            </div>

            <section className="zentro-holo-panel mt-12 rounded-2xl p-6 sm:p-8">
              <h2 className={`zentro-living-headline ${mH2}`}>Procurement checklist</h2>
              <ul className={`mt-4 space-y-2 ${mBody}`}>
                <li>Data residency via your Supabase project region</li>
                <li>FedRAMP-oriented deployment profile at /settings/deployment</li>
                <li>Row-level security per authenticated user</li>
                <li>Service-role isolation for webhooks and audit append</li>
                <li>Public trust, security, and privacy at /trust and /security</li>
                <li>Optional custom MSAs — contact sales for enterprise agreement</li>
              </ul>
              <p className={`mt-6 ${mBody}`}>
                <Link href="/settings/deployment" className="text-accent hover:underline">
                  deployment settings
                </Link>
                {" · "}
                <Link href="/pricing" className="text-accent hover:underline">
                  pricing
                </Link>
                {" · "}
                <Link href="/" className="text-accent hover:underline">
                  homepage
                </Link>
              </p>
            </section>
          </div>
        </main>
      </MarketingQuantumShell>
      <Footer />
    </>
  );
}
