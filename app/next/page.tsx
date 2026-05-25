import type { Metadata } from "next";
import Link from "next/link";

import { DimensionGate } from "@/components/landing/DimensionGate";
import { LivingPulse } from "@/components/landing/LivingPulse";
import { MarketingQuantumShell } from "@/components/landing/MarketingQuantumShell";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SITE_EMAIL_CONTACT, getMailtoHref } from "@/lib/billing";
import { mArticle, mBody, mCardTitle, mContainer, mEyebrow, mH1, mH2 } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "What's next",
  description: `Upcoming ${SITE_BRAND_NAME} capabilities — security integrations, enterprise controls, and operations depth.`,
};

type Horizon = "shipping" | "building" | "exploring";

const ROADMAP: {
  horizon: Horizon;
  title: string;
  subtitle: string;
  items: { name: string; detail: string }[];
}[] = [
  {
    horizon: "shipping",
    title: "Shipping now",
    subtitle: "Live in console — 49 migrations and refreshed marketing site.",
    items: [
      {
        name: "Automations ambient status layer",
        detail: "Automation-context health pulse on /automations — dry-run success rate, failed runs, and connector health with guardrail-focused headlines.",
      },
      {
        name: "Services ambient status layer",
        detail: "Service-context health pulse on /services — SLO burn, catalog size, and connector health with error-budget headlines.",
      },
      {
        name: "Approvals ambient status layer",
        detail: "Approval-context health pulse on /approvals — pending, high-risk, and policy-gap counts with guardrail-focused headlines.",
      },
      {
        name: "Incidents ambient status layer",
        detail: "Incident-context health pulse on /incidents — hot/open queue counts and triage-focused headlines.",
      },
      {
        name: "Hub module personalization",
        detail: "Pin console modules and reorder /hub quick links per user — pinned modules float to the top of the nav rail.",
      },
      {
        name: "Console jump search pinned shortcuts",
        detail: "Ctrl/Cmd+K shows pinned modules before recents, synced from hub personalization prefs.",
      },
      {
        name: "Console ambient status layer",
        detail: "Live health pulse and particle lattice on /hub and /overview from workspace telemetry.",
      },
      {
        name: "Staffing digest auto-chain cron",
        detail: "Single UTC-week run at /governance/compliance/staffing-digest-auto-chain — rollup → SLA digest → escalation.",
      },
      { name: "Marketing site refresh", detail: "Futuristic visual identity with clearer operational copy across homepage and key pages." },
      { name: "Cross-staffing committee escalation", detail: "Post-rollup SLA breach escalation at /governance/compliance/cross-staffing-committee-escalation." },
      { name: "Staffing action SLA breach digest", detail: "Post-peak completion SLA alerts at /governance/compliance/staffing-sla-breach-digest." },
      { name: "Staffing completion rollup export", detail: "Printable HTML/PDF archive at /governance/compliance/staffing-completion-rollup." },
      { name: "Staffing action overdue reminders", detail: "Past-peak-week nudges at /governance/compliance/staffing-action-reminders." },
      { name: "Obligation staffing action tracker", detail: "Track relief actions at /governance/compliance/staffing-actions." },
      { name: "Committee peak-week staffing digest", detail: "Capacity + load alert at /governance/compliance/peak-week-staffing-digest." },
      { name: "Compliance program dashboard", detail: "Executive rollup at /governance/compliance/program." },
    ],
  },
  {
    horizon: "building",
    title: "Building next",
    subtitle: "In active development — sequencing follows customer demand.",
    items: [
      {
        name: "Audit ambient status layer",
        detail: "Audit-context health pulse on /audit — export readiness, whisper recency, and append-only trail posture.",
      },
    ],
  },
  {
    horizon: "exploring",
    title: "Exploring",
    subtitle: "Research and design — not committed timelines.",
    items: [],
  },
];

const HORIZON_STYLE: Record<Horizon, { badge: string; glow: string }> = {
  shipping: {
    badge: "border-[var(--scan-dim)] bg-[var(--scan-dim)] text-[#6ee7b7]",
    glow: "from-[rgba(52,211,153,0.12)] to-transparent",
  },
  building: {
    badge: "border-accent/30 bg-accent/10 text-accent",
    glow: "from-[rgba(94,225,255,0.1)] to-transparent",
  },
  exploring: {
    badge: "border-[var(--cyber-dim)] bg-[var(--cyber-dim)] text-[#c4b5fd]",
    glow: "from-[rgba(167,139,250,0.12)] to-transparent",
  },
};

const SHIPPING_TOTAL = 61;

export default function NextPage() {
  return (
    <>
      <Header />
      <MarketingQuantumShell>
        <main className="flex-1 border-b border-white/[0.06]">
          <div className="zentro-hero-future zentro-quantum-section border-b border-white/[0.06]">
            <article className={`${mArticle} max-w-4xl`}>
              <LivingPulse />
              <p className={`${mEyebrow} zentro-eyebrow-cyber`}>⟡ Product roadmap</p>
              <h1 className={`mt-2 shynvo-headline zentro-living-headline ${mH1}`}>
                What&apos;s next for {SITE_BRAND_NAME}
              </h1>
              <p className={`mt-4 ${mBody} text-base sm:text-lg`}>
                Transparent sequencing for security, enterprise, and operations depth. Directional —
                not a contractual commitment.
              </p>
            </article>
          </div>

          <DimensionGate />

          <div className={`${mContainer} zentro-quantum-section py-12 sm:py-16`}>
            <div className="grid gap-6 lg:grid-cols-3">
              {ROADMAP.map((block) => {
                const style = HORIZON_STYLE[block.horizon];
                return (
                  <section
                    key={block.title}
                    className="zentro-bento-cell relative overflow-hidden rounded-2xl p-6"
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow} opacity-90`}
                      aria-hidden
                    />
                    <div className="relative">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className={`zentro-living-headline ${mH2}`}>{block.title}</h2>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}
                        >
                          {block.horizon}
                        </span>
                      </div>
                      <p className={`mt-2 ${mBody}`}>{block.subtitle}</p>

                      {block.items.length > 0 ? (
                        <ul className="mt-6 space-y-4">
                          {block.items.map((item) => (
                            <li
                              key={item.name}
                              className="rounded-xl border border-white/[0.06] bg-black/20 p-4"
                            >
                              <h3 className={`text-sm ${mCardTitle}`}>{item.name}</h3>
                              <p className={`mt-1.5 text-xs leading-relaxed ${mBody}`}>{item.detail}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={`mt-6 rounded-xl border border-dashed border-white/[0.08] p-4 text-sm ${mBody}`}>
                          Queue clear — watch{" "}
                          <Link href="/changelog" className="text-accent hover:underline">
                            changelog
                          </Link>
                          .
                        </p>
                      )}

                      {block.horizon === "shipping" ? (
                        <p className={`mt-6 text-xs ${mBody}`}>
                          Showing latest 8 of {SHIPPING_TOTAL}+ shipped capabilities.{" "}
                          <Link href="/changelog" className="font-medium text-accent hover:underline">
                            Full changelog →
                          </Link>
                        </p>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>

            <p className={`${mBody} mt-12 text-center`}>
              Want something prioritized?{" "}
              <a href={getMailtoHref()} className="text-accent hover:underline">
                {SITE_EMAIL_CONTACT}
              </a>
              {" · "}
              <Link href="/integrations" className="text-accent hover:underline">
                Integrations
              </Link>
            </p>
          </div>
        </main>
      </MarketingQuantumShell>
      <Footer />
    </>
  );
}
