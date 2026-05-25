import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mBody,
  mCardTitle,
  mContainer,
  mEyebrow,
  mH2,
  mLede,
  mSection,
} from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

const PILLARS = [
  {
    id: "ingest",
    tag: "01 · Signal",
    title: "Unified ingest",
    body: "Webhooks, HTTP tokens, and scanner adapters land as one incident spine — no shadow queues.",
    href: "/integrations",
    cta: "Integrations",
    span: "md:col-span-2 md:row-span-2",
    accent: "from-[rgba(94,225,255,0.12)] to-transparent",
  },
  {
    id: "surface",
    tag: "02 · Surface",
    title: "Threat & exposure",
    body: "Certs, secrets, drift, and prioritized vulns tied to services and owners.",
    href: "/cybersecurity",
    cta: "Cybersecurity",
    span: "",
    accent: "from-[rgba(167,139,250,0.1)] to-transparent",
  },
  {
    id: "guard",
    tag: "03 · Guard",
    title: "Guarded execution",
    body: "Dry-runs, policy blocks, and explicit approvals before anything irreversible runs.",
    href: "/automations",
    cta: "Automations",
    span: "",
    accent: "from-[rgba(52,211,153,0.1)] to-transparent",
  },
  {
    id: "grc",
    tag: "04 · Prove",
    title: "GRC & compliance depth",
    body: "Eight framework packs, assessor workbooks, obligation forecasting, and staffing SLAs — live in console.",
    href: "/auth/sign-in?next=/governance/compliance/program",
    cta: "Compliance program",
    span: "md:col-span-2",
    accent: "from-[rgba(94,225,255,0.08)] via-[rgba(167,139,250,0.06)] to-transparent",
  },
  {
    id: "audit",
    tag: "05 · Audit",
    title: "Evidence on demand",
    body: "Append-only activity, exportable incident records, and auditor-scoped API tokens.",
    href: "/auth/sign-in?next=/audit",
    cta: "Audit log",
    span: "",
    accent: "from-[rgba(52,211,153,0.08)] to-transparent",
  },
  {
    id: "scale",
    tag: "06 · Scale",
    title: "Enterprise posture",
    body: "Org-scoped RBAC, legal hold, FedRAMP-oriented exports, and multi-team workspaces.",
    href: "/enterprise",
    cta: "Enterprise",
    span: "",
    accent: "from-[rgba(167,139,250,0.08)] to-transparent",
  },
] as const;

export function CommandExperience() {
  return (
    <MarketingReveal id="command" className={mSection} aria-labelledby="command-heading">
      <div className={mContainer}>
        <p className={`${mEyebrow} zentro-eyebrow-cyber`}>Command surface</p>
        <h2 id="command-heading" className={`mt-2 ${mH2}`}>
          One neural control plane — not six disconnected dashboards
        </h2>
        <p className={mLede}>
          {SITE_BRAND_NAME} folds incident response, security posture, guarded automation, and
          compliance evidence into a single operator experience. No mock silos — every tile maps to
          a live console route after sign-in.
        </p>

        <div className="mt-10 grid gap-3 md:grid-cols-4 md:auto-rows-[minmax(7rem,auto)]">
          {PILLARS.map((cell) => (
            <Link
              key={cell.id}
              href={cell.href}
              className={`group zentro-bento-cell relative overflow-hidden rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5 ${cell.span}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cell.accent} opacity-80`}
                aria-hidden
              />
              <div className="relative">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent/80">
                  {cell.tag}
                </p>
                <h3 className={`mt-2 ${mCardTitle}`}>{cell.title}</h3>
                <p className={`mt-2 ${mBody}`}>{cell.body}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:underline">
                  {cell.cta}
                  <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MarketingReveal>
  );
}
