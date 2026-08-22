import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { mBodySm, mCardLink, mH2, mSystemMeta } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

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

/** Planned capability bands — calmer than primary platform layers. */
export function PlatformSurfaceMap() {
  return (
    <MarketingReveal as="article" className="smohix-platform-roadmap">
      <section className="smohix-platform-roadmap__band" aria-labelledby="platform-next-heading">
        <p className={`${mSystemMeta} text-muted/65`}>Planned · roadmap</p>
        <h2 id="platform-next-heading" className={mH2}>
          Next IT capabilities
        </h2>
        <p className={`mt-2 ${mBodySm} text-muted/85`}>
          Planned additions to round out enterprise operations workflows.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {NEXT_CAPABILITIES.map((item) => (
            <li key={item} className="smohix-platform-roadmap__chip">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="smohix-platform-roadmap__band" aria-labelledby="platform-vendor-heading">
        <h2 id="platform-vendor-heading" className={mH2}>
          Vendor integrations roadmap
        </h2>
        <p className={`mt-2 ${mBodySm} text-muted/85`}>
          Planned first-party connectors and supported webhook targets. These are roadmap targets, not live
          claims.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {VENDOR_ROADMAP.map((item) => (
            <li key={item.category} className="smohix-platform-roadmap__plane">
              <span className="smohix-platform-roadmap__plane-title">{item.category}</span>
              <span className="smohix-platform-roadmap__plane-body">{item.vendors}</span>
            </li>
          ))}
        </ul>
        <p className={`mt-4 ${mBodySm} text-muted/80`}>
          <Link href="/integrations" className="font-medium text-accent hover:underline">
            Open integrations roadmap
          </Link>
          {" · "}
          <Link href="/auth/sign-in?next=/settings/connectors" className="font-medium text-accent hover:underline">
            Configure live connectors
          </Link>
        </p>
      </section>

      <section className="smohix-platform-roadmap__band" aria-labelledby="platform-equipment-heading">
        <h2 id="platform-equipment-heading" className={mH2}>
          Equipment operations roadmap
        </h2>
        <p className={`mt-2 ${mBodySm} text-muted/85`}>
          Professional IT asset coverage to extend incidents, automations, approvals, and audit with
          equipment-level context.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`${mCardLink} smohix-platform-roadmap__phase p-4`}>
            <p className="smohix-platform-roadmap__plane-title">Phase 1: Core inventory</p>
            <ul className="mt-2 space-y-1 text-sm text-muted/85">
              {EQUIPMENT_PHASE_1.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </div>
          <div className={`${mCardLink} smohix-platform-roadmap__phase p-4`}>
            <p className="smohix-platform-roadmap__plane-title">Phase 2: Reliability and security</p>
            <ul className="mt-2 space-y-1 text-sm text-muted/85">
              {EQUIPMENT_PHASE_2.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </div>
          <div className={`${mCardLink} smohix-platform-roadmap__phase p-4`}>
            <p className="smohix-platform-roadmap__plane-title">Phase 3: Enterprise depth</p>
            <ul className="mt-2 space-y-1 text-sm text-muted/85">
              {EQUIPMENT_PHASE_3.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </div>
          <div className={`${mCardLink} smohix-platform-roadmap__phase p-4`}>
            <p className="smohix-platform-roadmap__plane-title">Next 5 to implement</p>
            <ul className="mt-2 space-y-1 text-sm text-muted/85">
              {EQUIPMENT_NEXT_FIVE.map((item) => (
                <li key={item}>— {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <p className={`mt-8 ${mBodySm} text-muted/80`}>
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
