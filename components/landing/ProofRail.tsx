import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mBody,
  mContainer,
  mFooterLabel,
  mH2,
  mLede,
  mPanelShell,
  mSectionTight,
} from "@/lib/marketing-layout";

const PROOFS = [
  {
    title: "Append-only audit",
    body: "Every approval, status change, and automation dry-run lands in org-scoped activity.",
    href: "/auth/sign-in?next=/audit",
    label: "Audit log",
  },
  {
    title: "Assessor-ready exports",
    body: "Unified workbooks, FedRAMP POA&M, and evidence lineage for external review.",
    href: "/auth/sign-in?next=/governance/compliance/workbook",
    label: "Workbook",
  },
  {
    title: "Guarded by default",
    body: "Nothing irreversible runs from chat — dry-run or explicit human checkpoint first.",
    href: "/automations",
    label: "Automations",
  },
  {
    title: "Your connectors",
    body: "Datadog, PagerDuty, Slack, and scanner adapters — configured by your team, not ours.",
    href: "/integrations",
    label: "Integrations",
  },
] as const;

const SAMPLE = `{
  "event_type": "automation.dry_run_recorded",
  "details": {
    "incident_id": "a1b2c3d4-...",
    "playbook_id": "pb-restart-workers",
    "result": "ok"
  }
}`;

export function ProofRail() {
  return (
    <MarketingReveal id="proof" className={mSectionTight} aria-labelledby="proof-heading">
      <div className={mContainer}>
        <h2 id="proof-heading" className={mH2}>
          Built to survive audits — not slide decks
        </h2>
        <p className={mLede}>
          Evidence, exports, and guarded execution are first-class — not bolted on after the demo.
        </p>

        <div className="zentro-proof-rail mt-8">
          {PROOFS.map((proof) => (
            <Link
              key={proof.title}
              href={proof.href}
              className="zentro-bento-cell group flex flex-col rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
            >
              <h3 className="text-sm font-semibold text-foreground">{proof.title}</h3>
              <p className={`mt-2 flex-1 ${mBody}`}>{proof.body}</p>
              <span className="mt-3 text-sm font-medium text-accent group-hover:underline">
                {proof.label} →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-start">
          <p className={mBody}>
            SOC teams, platform engineers, and GRC leads operate from the same record — incidents
            link to services, controls, and automation evidence without re-keying context.
          </p>
          <div>
            <p className={mFooterLabel}>Event format preview</p>
            <pre
              className={`mt-2 overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-foreground/85 ${mPanelShell} bg-black/40`}
              tabIndex={0}
            >
              {SAMPLE}
            </pre>
          </div>
        </div>
      </div>
    </MarketingReveal>
  );
}
