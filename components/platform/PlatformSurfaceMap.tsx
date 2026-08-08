import Link from "next/link";

import { LivingPulse } from "@/components/landing/LivingPulse";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mArticle,
  mCardLink,
  mEyebrow,
  mH2,
} from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

const MODULES = [
  {
    title: "Connectors",
    body: "Alert ingest and connector health checks.",
    href: "/auth/sign-in?next=/settings/connectors",
    cta: "Open connectors",
  },
  {
    title: "Services Catalog",
    body: "Track service ownership, context, and incident linkage.",
    href: "/auth/sign-in?next=/services",
    cta: "Open services",
  },
  {
    title: "Incidents",
    body: "Open, triage, link actions, resolve.",
    href: "/auth/sign-in?next=/incidents",
    cta: "Open incidents",
  },
  {
    title: "Automations",
    body: "Dry-run first, then approve and execute.",
    href: "/auth/sign-in?next=/automations",
    cta: "Open automations",
  },
  {
    title: "Runbooks",
    body: "Structured procedures for live operations.",
    href: "/auth/sign-in?next=/runbooks",
    cta: "Browse runbooks",
  },
  {
    title: "Reasoning",
    body: "Contextual suggestions for safer next steps.",
    href: "/auth/sign-in?next=/copilot",
    cta: "Open reasoning",
  },
  {
    title: "Approvals",
    body: "Approval-first gate for high-impact changes.",
    href: "/auth/sign-in?next=/approvals",
    cta: "Open approvals",
  },
  {
    title: "Audit",
    body: "One evidence stream for key actions.",
    href: "/auth/sign-in?next=/audit",
    cta: "Open audit",
  },
  {
    title: "Network & exposure",
    body: "Devices, config drift, certificates, and secrets inventory.",
    href: "/auth/sign-in?next=/assets/network",
    cta: "Open assets",
  },
  {
    title: "Access governance",
    body: "MFA posture, policy rules, and high-risk execution blocks.",
    href: "/auth/sign-in?next=/governance/access",
    cta: "Open governance",
  },
  {
    title: "Settings & keys",
    body: "API keys, billing, connectors, and execution posture.",
    href: "/auth/sign-in?next=/settings",
    cta: "Open settings",
  },
] as const;

const IT_SURFACES = [
  {
    title: "Connectors Health",
    body: "Check reasoning and robot endpoint reachability.",
    href: "/auth/sign-in?next=/settings/connectors",
    cta: "Check connectors",
  },
  {
    title: "API Docs",
    body: "Integration-facing routes and capability reference.",
    href: "/docs/api",
    cta: "View API docs",
  },
  {
    title: "System Status",
    body: "Public platform posture and reliability communication.",
    href: "/status",
    cta: "Open status",
  },
  {
    title: "API Keys",
    body: "Manage operator credentials for proxy-backed calls.",
    href: "/auth/sign-in?next=/settings/api-keys",
    cta: "Manage keys",
  },
  {
    title: "Billing Control",
    body: "Plan state, checkout path, and subscription visibility.",
    href: "/auth/sign-in?next=/settings/billing",
    cta: "Open billing",
  },
] as const;

const NEXT_CAPABILITIES = [
  "On-call schedules",
  "Change calendar",
  "Service dependency graph",
  "SLO and error budget views",
  "ITSM sync (Jira/ServiceNow)",
  "Structured alert adapters",
] as const;

const VENDOR_ROADMAP = [
  { category: "Monitoring", vendors: "Datadog, Prometheus/Grafana Alerting, New Relic" },
  { category: "Chat & paging", vendors: "Slack, Microsoft Teams, PagerDuty (events)" },
  { category: "Cloud control planes", vendors: "AWS, Azure, GCP" },
  { category: "ITSM / tickets", vendors: "Jira, ServiceNow, Linear (change tasks)" },
  { category: "Security & exposure", vendors: "Splunk, Sentinel, CrowdStrike, Qualys, Tenable" },
] as const;

const EQUIPMENT_PHASE_1 = [
  "Laptops and workstations",
  "Servers (physical and VM)",
  "Network gear (routers, switches, firewalls, APs)",
  "Storage and backup appliances",
] as const;

const EQUIPMENT_PHASE_2 = [
  "Identity and access infrastructure",
  "Power and facility monitoring (UPS/PDU/generator)",
  "VPN and edge devices",
  "Observability tools as managed assets",
] as const;

const EQUIPMENT_PHASE_3 = [
  "Telephony and contact center equipment",
  "IoT and OT endpoints",
  "Certificate and secrets inventory",
  "License and SaaS dependency inventory",
] as const;

const EQUIPMENT_NEXT_FIVE = [
  "Certificate and secrets inventory",
  "Backup and restore readiness tracking",
  "Network firmware and config drift tracking",
  "MFA and privileged access posture",
  "Maintenance windows and change calendar",
] as const;

export function PlatformSurfaceMap() {
  return (
    <MarketingReveal as="article" className={`${mArticle} smohix-quantum-section`}>
      <LivingPulse />
      <p className={`${mEyebrow} smohix-eyebrow-cyber`}>⟡ Platform map</p>
      <h1 className="smohix-living-headline mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Operational surfaces — one console
      </h1>
      <p className="mt-2 text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">
        {SITE_BRAND_NAME} is a controlled operations console: incidents, automations, approvals, audit,
        runbooks, connectors, governance, and reasoning in one place.
      </p>
      <p className="mt-1.5 text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">
        Start here: open an incident, connect alert ingest, run your first dry-run.
      </p>

      <section className="mt-6">
        <h2 className={mH2}>Module map</h2>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((item) => (
            <li key={item.title}>
              <Link href={item.href} className={`${mCardLink} min-h-40 p-3.5`}>
                <span className="text-[13px] font-semibold text-foreground sm:text-sm">{item.title}</span>
                <span className="mt-1 flex-1 text-[13px] leading-5 text-foreground/80 sm:text-sm sm:leading-6">
                  {item.body}
                </span>
                <span className="mt-2.5 text-[11px] font-semibold text-accent/90 group-hover:underline sm:text-xs">
                  {item.cta} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7">
        <h2 className={mH2}>IT operations toolkit</h2>
        <p className="mt-1.5 text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">
          Core IT surfaces for reliability, integrations, and controlled execution.
        </p>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {IT_SURFACES.map((item) => (
            <li key={item.title}>
              <Link href={item.href} className={`${mCardLink} min-h-36 p-3.5`}>
                <span className="text-[13px] font-semibold text-foreground sm:text-sm">{item.title}</span>
                <span className="mt-1 flex-1 text-[13px] leading-5 text-foreground/80 sm:text-sm sm:leading-6">
                  {item.body}
                </span>
                <span className="mt-2.5 text-[11px] font-semibold text-accent/90 group-hover:underline sm:text-xs">
                  {item.cta} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7">
        <h2 className={mH2}>Next IT capabilities</h2>
        <p className="mt-1.5 text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">
          Planned additions to round out enterprise operations workflows.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {NEXT_CAPABILITIES.map((item) => (
            <li
              key={item}
              className="rounded-full border border-white/15 bg-white/[0.02] px-2.5 py-1 text-xs font-medium text-foreground/80"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-7">
        <h2 className={mH2}>Vendor integrations roadmap</h2>
        <p className="mt-1.5 text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">
          Planned first-party connectors and supported webhook targets. These are roadmap targets,
          not live claims.
        </p>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {VENDOR_ROADMAP.map((item) => (
            <li key={item.category} className={`${mCardLink} min-h-24 p-3.5`}>
              <span className="text-[13px] font-semibold text-foreground sm:text-sm">{item.category}</span>
              <span className="mt-1 text-[13px] leading-5 text-foreground/80 sm:text-sm sm:leading-6">
                {item.vendors}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-6 text-foreground/75 sm:text-base sm:leading-7">
          <Link href="/integrations" className="font-medium text-accent hover:underline">
            Open integrations roadmap
          </Link>
          {" · "}
          <Link href="/auth/sign-in?next=/settings/connectors" className="font-medium text-accent hover:underline">
            Configure live connectors
          </Link>
        </p>
      </section>

      <section className="mt-7">
        <h2 className={mH2}>Equipment operations roadmap</h2>
        <p className="mt-1.5 text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">
          Professional IT asset coverage to extend incidents, automations, approvals, and audit with
          equipment-level context.
        </p>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`${mCardLink} min-h-36 p-3.5`}>
            <p className="text-[13px] font-semibold text-foreground sm:text-sm">Phase 1: Core inventory</p>
            <ul className="mt-1.5 space-y-1 text-[13px] leading-5 text-foreground/80 sm:text-sm sm:leading-6">
              {EQUIPMENT_PHASE_1.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className={`${mCardLink} min-h-36 p-3.5`}>
            <p className="text-[13px] font-semibold text-foreground sm:text-sm">Phase 2: Reliability and security</p>
            <ul className="mt-1.5 space-y-1 text-[13px] leading-5 text-foreground/80 sm:text-sm sm:leading-6">
              {EQUIPMENT_PHASE_2.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className={`${mCardLink} min-h-36 p-3.5`}>
            <p className="text-[13px] font-semibold text-foreground sm:text-sm">Phase 3: Enterprise depth</p>
            <ul className="mt-1.5 space-y-1 text-[13px] leading-5 text-foreground/80 sm:text-sm sm:leading-6">
              {EQUIPMENT_PHASE_3.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className={`${mCardLink} min-h-36 p-3.5`}>
            <p className="text-[13px] font-semibold text-foreground sm:text-sm">Next 5 to implement</p>
            <ul className="mt-1.5 space-y-1 text-[13px] leading-5 text-foreground/80 sm:text-sm sm:leading-6">
              {EQUIPMENT_NEXT_FIVE.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <p className="mt-8 text-sm leading-6 text-foreground/75 sm:text-base sm:leading-7">
        <Link href="/platform/overview" className="font-medium text-accent hover:underline">
          Platform overview
        </Link>
        {" · "}
        <Link href="/why" className="font-medium text-accent hover:underline">
          Why {SITE_BRAND_NAME}
        </Link>
        {" · "}
        <Link href="/next" className="font-medium text-accent hover:underline">
          What&apos;s next
        </Link>
        {" · "}
        <Link href="/cybersecurity" className="font-medium text-accent hover:underline">
          Cybersecurity
        </Link>
        {" · "}
        <Link href="/trust" className="font-medium text-accent hover:underline">
          Trust
        </Link>
      </p>
    </MarketingReveal>
  );
}
