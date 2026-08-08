import type { Metadata } from "next";
import Link from "next/link";

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
    title: "Available now",
    subtitle: "Core workflows available in the console today.",
    items: [
      {
        name: "Incident command and response loop",
        detail: "Incidents, assignees, comments, handoffs, runbooks, RCA context, and evidence export in one workspace.",
      },
      {
        name: "Guarded automation",
        detail: "Dry-runs, approval gates, rollback evidence, policy checks, and step-level remediation receipts.",
      },
      {
        name: "Audit and compliance evidence",
        detail: "Org-scoped audit log, evidence bundles, compliance mappings, retention controls, and assessor exports.",
      },
      {
        name: "Service and deploy context",
        detail: "Service catalog, SLO context, deploy event ingest, change correlation, and incident-linked context for Copilot.",
      },
    ],
  },
  {
    horizon: "building",
    title: "Building next",
    subtitle: "Near-term product work, sequenced by customer demand and safety review.",
    items: [
      {
        name: "Native vendor connectors",
        detail: "OAuth-backed integrations for paging, monitoring, SIEM, ticketing, and chat beyond today's webhook/API paths.",
      },
      {
        name: "Organization administration",
        detail: "Stronger member lifecycle, SSO configuration, billing seat controls, and workspace policy controls.",
      },
      {
        name: "Compliance workflow consolidation",
        detail: "Fewer deeper compliance surfaces, clearer review queues, and buyer-ready evidence packaging.",
      },
    ],
  },
  {
    horizon: "exploring",
    title: "Exploring",
    subtitle: "Research areas only; not committed timelines or live product claims.",
    items: [
      {
        name: "Advanced Copilot review controls",
        detail: "Structured citations, model output review queues, and richer incident summarization after operator validation.",
      },
      {
        name: "Remediation partner ecosystem",
        detail: "Safer execution handoffs to internal robot services and future vendor automation partners.",
      },
    ],
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

export default function NextPage() {
  return (
    <>
      <Header />
      <MarketingQuantumShell>
        <main className="flex-1 border-b border-white/[0.06]">
          <div className="smohix-hero-future smohix-quantum-section border-b border-white/[0.06]">
            <article className={`${mArticle} max-w-4xl`}>
              <p className={`${mEyebrow} smohix-eyebrow-cyber`}>Product roadmap</p>
              <h1 className={`mt-2 smohix-headline smohix-living-headline ${mH1}`}>
                What&apos;s next for {SITE_BRAND_NAME}
              </h1>
              <p className={`mt-4 ${mBody} text-base sm:text-lg`}>
                Transparent sequencing for security, enterprise, and operations depth. Directional —
                not a contractual commitment.
              </p>
            </article>
          </div>

          <div className={`${mContainer} smohix-quantum-section py-12 sm:py-16`}>
            <div className="grid gap-6 lg:grid-cols-3">
              {ROADMAP.map((block) => {
                const style = HORIZON_STYLE[block.horizon];
                return (
                  <section
                    key={block.title}
                    className="smohix-bento-cell relative overflow-hidden rounded-2xl p-6"
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow} opacity-90`}
                      aria-hidden
                    />
                    <div className="relative">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className={`smohix-living-headline ${mH2}`}>{block.title}</h2>
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
                          For release-level history, see the{" "}
                          <Link href="/changelog" className="font-medium text-accent hover:underline">
                            changelog
                          </Link>
                          .
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
