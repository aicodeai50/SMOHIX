import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SITE_EMAIL_CONTACT, getMailtoHref } from "@/lib/billing";
import { mArticle, mBody, mCard, mCardTitle, mEyebrow, mH1, mH2 } from "@/lib/marketing-layout";
import { SITE_BRAND_NAME } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "What's next",
  description: `Upcoming ${SITE_BRAND_NAME} capabilities — security integrations, enterprise controls, and operations depth.`,
};

type Horizon = "shipping" | "building" | "exploring";

const ROADMAP: {
  horizon: Horizon;
  title: string;
  items: { name: string; detail: string }[];
}[] = [
  {
    horizon: "shipping",
    title: "Shipping now",
    items: [
      { name: "Compliance evidence request SLA dashboard", detail: "Request SLAs at /governance/compliance/evidence-request-sla." },
      { name: "Compliance attestation renewal calendar", detail: "Renewal waves at /governance/compliance/attestation-renewal." },
      { name: "Compliance committee meeting pack", detail: "Quarterly ZIP at /governance/compliance/committee-meeting-pack." },
      { name: "Compliance control health scorecard", detail: "Leadership health score at /governance/compliance/control-health-scorecard." },
      { name: "Inherited control coverage gap report", detail: "Vendor inherited control gaps at /governance/compliance/inherited-control-gaps." },
      { name: "Regulatory mapping change digest", detail: "Catalog & crosswalk alerts at /governance/compliance/mapping-digest." },
      { name: "Compliance obligation ICS export", detail: "Calendar feed at /governance/compliance/obligation-ics." },
      { name: "Assessor evidence request workflow", detail: "Auditor document requests at /governance/compliance/evidence-requests." },
      { name: "Compliance exception register", detail: "Policy and control exceptions at /governance/compliance/exception-register." },
      { name: "GRC control ownership matrix", detail: "RACI owners per control at /governance/compliance/control-ownership." },
      { name: "Unified compliance posture score", detail: "Org-wide GRC score 0–100 at /governance/compliance/posture-score." },
      { name: "Compliance KPI trend dashboards", detail: "Readiness and remediation velocity at /governance/compliance/kpi-trends." },
      { name: "Compliance scope boundary mapper", detail: "Systems and data flows mapped to control packs at /governance/compliance/scope-boundary." },
      { name: "Staffing action overdue reminders", detail: "Past-peak-week nudges at /governance/compliance/staffing-action-reminders." },
      { name: "Obligation staffing action tracker", detail: "Track relief actions at /governance/compliance/staffing-actions." },
      { name: "Committee peak-week staffing digest", detail: "Capacity + load alert at /governance/compliance/peak-week-staffing-digest." },
      { name: "Obligation owner load balancing", detail: "Peak-week RACI rebalance at /governance/compliance/obligation-load-balancing." },
      { name: "Committee obligation capacity budget", detail: "Owner-hours vs peaks at /governance/compliance/committee-capacity-budget." },
      { name: "Board obligation what-if scenarios", detail: "Forecast stress tests at /governance/compliance/obligation-whatif." },
      { name: "Obligation density trend history", detail: "Trailing-quarter chart at /governance/compliance/obligation-density-trend-history." },
      { name: "Compliance obligation density alerting", detail: "Threshold Slack and email at /governance/compliance/obligation-density-alerts." },
      { name: "Obligation executive rollup PDF", detail: "Printable board packet at /governance/compliance/obligation-rollup." },
      { name: "Quarterly obligation committee digest", detail: "Forecast + crossover + SLA email at /governance/compliance/committee-digest." },
      { name: "Board obligation forecast timeline", detail: "Weekly density chart at /governance/compliance/obligation-forecast." },
      { name: "Obligation consolidation playbook", detail: "Crossover cluster workflows at /governance/compliance/obligation-consolidation." },
      { name: "Multi-framework obligation crossover report", detail: "Evidence reuse clusters at /governance/compliance/obligation-crossover." },
      { name: "Regulatory obligation heatmap", detail: "Open obligations by framework and vendor at /governance/compliance/obligation-heatmap." },
      { name: "Control testing evidence linker", detail: "Test runs linked to bundles at /governance/compliance/testing-evidence-linker." },
      { name: "Automated control testing schedules", detail: "Recurring evidence windows at /governance/compliance/testing-schedules." },
      { name: "Compliance evidence lineage tracking", detail: "Audit → bundle → workbook trails at /governance/compliance/evidence-lineage." },
      { name: "Regulatory change impact simulator", detail: "Scenario readiness deltas vs live baseline at /governance/compliance/regulatory-impact." },
      { name: "Cross-framework control dependency graph", detail: "Shared evidence paths and control links across packs at /governance/compliance/control-graph." },
      { name: "Compliance policy drift detection", detail: "Guardrail gaps vs live assessment exceptions at /governance/compliance/policy-drift." },
      { name: "Continuous control benchmarking", detail: "Live readiness vs industry p25–p90 bands at /governance/compliance/benchmarking." },
      { name: "Compliance calendar & audit season", detail: "Attestations, vendor reviews, bundles, and framework checkpoints at /governance/compliance/calendar." },
      { name: "Board-ready GRC executive summary", detail: "Printable leadership rollup at /governance/compliance/executive-summary." },
      { name: "Compliance risk heatmap", detail: "Framework and vendor risk concentration at /governance/compliance/risk-heatmap." },
      { name: "Compliance automation runbooks", detail: "Link live assessment gaps to runbooks and playbooks at /governance/compliance/runbooks." },
      { name: "Assessor-scoped compliance API tokens", detail: "Read-only zentro_ca_* tokens at /governance/compliance/assessor-api." },
      { name: "Multi-framework baseline comparison", detail: "Readiness deltas across all packs at /governance/compliance/baseline-comparison." },
      { name: "Control evidence freshness", detail: "Stale control queue at /governance/compliance/evidence-freshness." },
      { name: "FedRAMP POA&M export", detail: "NIST 800-53 POA&M from assessment gaps at /governance/compliance/fedramp-poam." },
      { name: "Compliance SLA reminders", detail: "Email and Slack nudges at /governance/compliance/sla-reminders." },
      { name: "Compliance program dashboard", detail: "Executive rollup at /governance/compliance/program." },
      { name: "Unified assessor workbook", detail: "ZIP evidence bundle at /governance/compliance/workbook." },
      { name: "Eight-framework GRC packs", detail: "SOC 2, ISO, PCI, HIPAA, NIST CSF, CIS v8, CMMC L2, GDPR Art. 32 — see /changelog for the full compliance history." },
      { name: "Org-scoped RBAC & audit", detail: "Shared org audit_log, members, and resource scope at /audit and /settings/members." },
      { name: "Vulnerability & alert ingest", detail: "Scanner and SIEM/EDR adapters; prioritized queue at /assets/vulnerabilities." },
      { name: "Equipment operations (console)", detail: "Certificates, secrets, network drift, access posture — live in console." },
    ],
  },
  {
    horizon: "building",
    title: "Building next",
    items: [],
  },
  {
    horizon: "exploring",
    title: "Exploring",
    items: [
      {
        name: "Staffing completion rollup export",
        detail: "Scheduled HTML or PDF rollup of completed vs open staffing actions for committee archives.",
      },
    ],
  },
];

const HORIZON_STYLE: Record<Horizon, string> = {
  shipping: "border-[var(--scan-dim)] bg-[var(--scan-dim)] text-[#6ee7b7]",
  building: "border-accent/30 bg-accent/10 text-accent",
  exploring: "border-[var(--cyber-dim)] bg-[var(--cyber-dim)] text-[#c4b5fd]",
};

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
              Transparent sequencing for security, enterprise, and operations depth. Timelines shift
              with customer demand — this page is directional, not a contractual commitment.
            </p>
          </article>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          {ROADMAP.map((block) => (
            <section key={block.title} className="mb-12 last:mb-0">
              <h2 className={mH2}>{block.title}</h2>
              <ul className="mt-6 space-y-4">
                {block.items.map((item) => (
                  <li key={item.name} className={mCard}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className={mCardTitle}>{item.name}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${HORIZON_STYLE[block.horizon]}`}
                      >
                        {block.horizon}
                      </span>
                    </div>
                    <p className={`mt-2 ${mBody}`}>{item.detail}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <p className={`${mBody} mt-10`}>
            Want something prioritized? Email{" "}
            <a href={getMailtoHref()} className="text-accent hover:underline">
              {SITE_EMAIL_CONTACT}
            </a>{" "}
            with your stack and use case. See also{" "}
            <Link href="/integrations" className="text-accent hover:underline">
              integrations
            </Link>{" "}
            and{" "}
            <Link href="/changelog" className="text-accent hover:underline">
              changelog
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
