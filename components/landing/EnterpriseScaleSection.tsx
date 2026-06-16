import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mBody,
  mContainer,
  mEyebrow,
  mH2,
  mLede,
  mPanelShell,
  mSection,
} from "@/lib/marketing-layout";
import { getMailtoHref } from "@/lib/billing";

const enterpriseItems = [
  {
    title: "Multi-region posture",
    detail: "Separate production, staging, and regulated workloads with scoped policies per environment.",
  },
  {
    title: "Procurement-ready evidence",
    detail: "Append-only audit, incident export, and webhook delivery logs for SOC 2 and vendor review.",
  },
  {
    title: "Delegated approvers",
    detail: "Route high-risk automation and remediation to security + platform reviewers before execution.",
  },
  {
    title: "Dedicated support lane",
    detail: "Priority onboarding, connector hardening, and custom retention for regulated industries.",
  },
] as const;

export function EnterpriseScaleSection() {
  const salesHref = getMailtoHref("enterprise");

  return (
    <MarketingReveal id="enterprise" className={mSection}>
      <div className={mContainer}>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className={mEyebrow}>Built for large organizations</p>
            <h2 className={`mt-2 ${mH2}`}>Enterprise-grade operations at Fortune scale</h2>
            <p className={mLede}>
              Global platform teams, MSSPs, and internal security groups use Zentro as the control
              layer between detection tools and production — where every containment step is
              authorized, recorded, and replayable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/enterprise"
                className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-background hover:opacity-90"
              >
                Enterprise overview
              </Link>
              <a
                href={salesHref}
                className="inline-flex h-10 items-center rounded-lg border border-white/[0.12] bg-white/[0.03] px-4 text-sm font-medium text-foreground/90 hover:border-accent/35"
              >
                Talk to sales
              </a>
            </div>
          </div>

          <div className="zentro-holo-panel overflow-hidden p-6 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent/80">
              Enterprise control matrix
            </p>
            <ul className="mt-5 divide-y divide-white/[0.06]">
              {enterpriseItems.map((item) => (
                <li key={item.title} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className={`mt-1 ${mBody}`}>{item.detail}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-white/[0.08] bg-black/30 p-4">
              <p className="font-mono text-[10px] text-muted">compliance.export · sample</p>
              <pre className="mt-2 overflow-x-auto font-mono text-[9px] leading-relaxed text-foreground/75">
                {`{
  "event_type": "automation.remediation_executed",
  "approver": "security-lead@corp",
  "risk_tier": "high",
  "evidence_hash": "sha256:…"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </MarketingReveal>
  );
}
