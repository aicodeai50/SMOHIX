import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mBody,
  mCard,
  mCardTitle,
  mContainer,
  mH2,
  mLede,
  mSection,
  mStaggerGrid,
} from "@/lib/marketing-layout";

const CASES = [
  {
    title: "Restart failing services with approval",
    body: "Wire a playbook, dry-run impact, get a recorded approval, then execute through your automation connector.",
  },
  {
    title: "Rollback or mitigate bad deployments",
    body: "Pair Copilot checklists with automation dry-runs so the team agrees on the smallest safe step before touching prod.",
  },
  {
    title: "Handle alerts with controlled automation",
    body: "HTTP ingest opens or dedupes incidents; responders link runbooks and only then promote actions out of simulation.",
  },
  {
    title: "Track every production change",
    body: "Keep status, approvals, and automation events in one audit trail — export incident notes when compliance asks.",
  },
  {
    title: "Triage intrusion signals in one queue",
    body: "Correlate SIEM and webhook alerts into deduped incidents with owner, severity, and linked services.",
  },
  {
    title: "Prioritize exposure before breach",
    body: "Certificate expiry, secrets rotation, and network drift surface as owned findings — not spreadsheet chaos.",
  },
  {
    title: "Run penetration tests with guardrails",
    body: "Scope exercises, record findings, and promote remediations through dry-runs — no unlogged production access.",
  },
  {
    title: "Prove containment to auditors",
    body: "Export timeline, approver identity, and automation evidence for IR reports and regulatory requests.",
  },
] as const;

export function UseCasesSection() {
  return (
    <MarketingReveal
      id="use-cases"
      className={mSection}
      aria-labelledby="use-cases-heading"
    >
      <div className={mContainer}>
        <h2 id="use-cases-heading" className={mH2}>
          Concrete outcomes
        </h2>
        <p className={mLede}>
          Operational and security outcomes you can assign an owner to — phrased the way SOC leads,
          on-call engineers, and change managers actually talk.
        </p>
        <ul className={`mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 ${mStaggerGrid}`}>
          {CASES.map((c) => (
            <li key={c.title} className={mCard}>
              <h3 className={mCardTitle}>{c.title}</h3>
              <p className={`mt-2 ${mBody}`}>{c.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </MarketingReveal>
  );
}
