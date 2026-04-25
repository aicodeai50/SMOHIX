import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { mBody, mCardLink, mContainer, mH1 } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Docs",
  description: "Learn hub — platform narrative, integrations, and console entry points.",
};

const CARDS = [
  {
    title: "HTTP API reference",
    body: "Methods, paths, auth — grouped catalog plus OpenAPI sketch for tooling.",
    href: "/docs/api",
  },
  {
    title: "Platform overview",
    body: "Summary, product surface, end-to-end flow, guarded model, capabilities, runtime modes, differentiation, architecture.",
    href: "/platform",
  },
  {
    title: "Trust & governance",
    body: "Audit, approvals, connectors, API keys, execution posture, and limits — how the product earns review.",
    href: "/trust",
  },
  {
    title: `Why ${SITE_BRAND_NAME}`,
    body: "Short philosophy — accountability over hype, guarded automation as thesis.",
    href: "/why",
  },
  {
    title: "Integrations",
    body: "Current connector categories and platform integration guidance.",
    href: "/integrations",
  },
  {
    title: "Decision intelligence",
    body: "How risk scoring, approval briefs, and predicted-vs-actual outcomes support safer changes.",
    href: "/governance/policies",
  },
  {
    title: "Vision & roadmap (console)",
    body: "Long-horizon direction inside the authenticated app.",
    href: "/auth/sign-in?next=/vision",
  },
  {
    title: "Incidents",
    body: "Create, manage, timeline, postmortem, markdown export when DB-backed.",
    href: "/auth/sign-in?next=/incidents",
  },
  {
    title: "Automations & dry-run",
    body: "Playbooks and simulation API before production calls.",
    href: "/auth/sign-in?next=/automations",
  },
  {
    title: "Connectors & billing",
    body: "Optional HTTP backends, Lemon Squeezy, API keys, alert ingest tokens.",
    href: "/auth/sign-in?next=/settings",
  },
] as const;

export default function DocsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className={`${mContainer} py-12 sm:py-16`}>
          <h1 className={mH1}>Learn hub</h1>
          <p className={`mt-4 max-w-2xl ${mBody}`}>
            Open documentation for narrative and entry points. Deep API reference can grow here over
            time; today the highest-signal doc is the{" "}
            <Link href="/platform" className="font-medium text-accent hover:underline">
              platform overview
            </Link>
            .
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((c) => (
              <li key={c.title}>
                <Link href={c.href} className={`${mCardLink} h-full`}>
                  <h2 className="text-base font-semibold text-foreground">{c.title}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{c.body}</p>
                  <span className="mt-4 text-xs font-semibold text-accent">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={`mt-12 ${mBody}`}>
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
