import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mBody,
  mContainer,
  mEyebrow,
  mH2,
  mLede,
  mSection,
} from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

const METRICS = [
  { value: "1", label: "Incident record", detail: "Owners, status, runbooks, Copilot context, remediation, and exports stay attached." },
  { value: "4", label: "Guardrail layers", detail: "Dry-run freshness, policy checks, approval notes, and rollback evidence." },
  { value: "8", label: "Framework packs", detail: "Representative control packs mapped to audit events and evidence exports." },
  { value: "52", label: "Database migrations", detail: "Auth, org scope, audit, compliance evidence, billing, and operational records." },
] as const;

const PILLARS = [
  {
    title: "Incident command",
    body: "Unified queue for alerts, ownership, runbooks, Copilot triage, and timeline export — not another ticket silo.",
  },
  {
    title: "Guarded automation",
    body: "Dry-runs, approval gates, and connector health before anything touches production.",
  },
  {
    title: "Cybersecurity operations",
    body: "Alert ingest, vulnerability findings, attack-path simulation from catalog data, and pentest rollups in the same console.",
  },
  {
    title: "GRC & evidence",
    body: "Control attestation, assessor workbooks, obligation staffing, committee packs, and append-only audit.",
  },
] as const;

export function CompanyScaleSection() {
  return (
    <MarketingReveal id="company" className={mSection}>
      <div className={mContainer}>
        <p className={mEyebrow}>Built around the work operators actually do</p>
        <h2 className={`mt-2 ${mH2}`}>
          {SITE_BRAND_NAME} focuses on the evidence behind each operational decision
        </h2>
        <p className={mLede}>
          The product is strongest where incidents, approvals, automation runs, service context, and
          audit records meet. The console is designed to show who decided, what ran, and what evidence
          remains afterward.
        </p>

        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <div
              key={metric.label}
              className="zentro-bento-cell rounded-2xl border border-white/[0.08] p-5 sm:p-6"
            >
              <dt className="font-mono text-3xl font-semibold tracking-tight text-accent sm:text-4xl">
                {metric.value}
              </dt>
              <dd className="mt-2 text-sm font-semibold text-foreground">{metric.label}</dd>
              <dd className={`mt-1 ${mBody}`}>{metric.detail}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <li
              key={pillar.title}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <h3 className="text-sm font-semibold text-foreground">{pillar.title}</h3>
              <p className={`mt-2 ${mBody}`}>{pillar.body}</p>
            </li>
          ))}
        </ul>

        <p className={`mt-10 ${mBody}`}>
          <Link href="/about" className="font-medium text-accent hover:underline">
            About {SITE_BRAND_NAME}
          </Link>
          {" · "}
          <Link href="/platform" className="font-medium text-accent hover:underline">
            Platform map
          </Link>
          {" · "}
          <Link href="/changelog" className="font-medium text-accent hover:underline">
            Changelog
          </Link>
        </p>
      </div>
    </MarketingReveal>
  );
}
