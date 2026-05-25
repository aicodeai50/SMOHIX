import type { Metadata } from "next";
import Link from "next/link";

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
    subtitle: "Live in console — 46+ compliance migrations and growing.",
    items: [
      { name: "Cross-staffing committee escalation", detail: "Post-rollup SLA breach escalation at /governance/compliance/cross-staffing-committee-escalation." },
      { name: "Staffing action SLA breach digest", detail: "Post-peak completion SLA alerts at /governance/compliance/staffing-sla-breach-digest." },
      { name: "Staffing completion rollup export", detail: "Printable HTML/PDF archive at /governance/compliance/staffing-completion-rollup." },
      { name: "Staffing action overdue reminders", detail: "Past-peak-week nudges at /governance/compliance/staffing-action-reminders." },
      { name: "Obligation staffing action tracker", detail: "Track relief actions at /governance/compliance/staffing-actions." },
      { name: "Committee peak-week staffing digest", detail: "Capacity + load alert at /governance/compliance/peak-week-staffing-digest." },
      { name: "Compliance program dashboard", detail: "Executive rollup at /governance/compliance/program." },
      { name: "Unified assessor workbook", detail: "ZIP evidence bundle at /governance/compliance/workbook." },
      { name: "Eight-framework GRC packs", detail: "SOC 2, ISO, PCI, HIPAA, NIST CSF, CIS v8, CMMC L2, GDPR — full history in changelog." },
    ],
  },
  {
    horizon: "building",
    title: "Building next",
    subtitle: "In active development — sequencing follows customer demand.",
    items: [],
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

const SHIPPING_TOTAL = 52;

export default function NextPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="zentro-hero-future border-b border-white/[0.06]">
          <article className={`${mArticle} max-w-4xl`}>
            <p className={`${mEyebrow} zentro-eyebrow-cyber`}>Roadmap</p>
            <h1 className={`mt-2 shynvo-headline ${mH1}`}>What&apos;s next for {SITE_BRAND_NAME}</h1>
            <p className={`mt-4 ${mBody} text-base sm:text-lg`}>
              Transparent sequencing for security, enterprise, and operations depth. Directional —
              not a contractual commitment.
            </p>
          </article>
        </div>

        <div className={`${mContainer} py-12 sm:py-16`}>
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
                      <h2 className={mH2}>{block.title}</h2>
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
                        Queue clear — focus is on shipping backlog. Watch{" "}
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
      <Footer />
    </>
  );
}
