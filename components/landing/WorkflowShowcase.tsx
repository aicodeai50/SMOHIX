import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { mBody, mCardTitle, mContainer, mEyebrow, mH2, mLede, mSectionTight } from "@/lib/marketing-layout";

const WORKFLOWS = [
  {
    title: "Alert ingest",
    caption: "Webhook → incident #8841",
    body: "Datadog, PagerDuty, or custom HTTP token opens one deduped incident with owner and service context.",
    kind: "ingest" as const,
  },
  {
    title: "Approval gate",
    caption: "Policy block → human checkpoint",
    body: "High-risk playbook pauses until an approver records a decision — no silent production changes.",
    kind: "approval" as const,
  },
  {
    title: "Audit trail",
    caption: "Dry-run → execute → evidence",
    body: "Automation events, approvals, and status changes append to an exportable log for review and compliance.",
    kind: "audit" as const,
  },
] as const;

function WorkflowMock({ kind }: { kind: (typeof WORKFLOWS)[number]["kind"] }) {
  if (kind === "ingest") {
    return (
      <div className="mt-4 space-y-2 font-mono text-[10px]">
        <p className="text-muted">POST /api/alerts/ingest</p>
        <p className="rounded border border-white/[0.08] bg-black/40 p-2 text-accent/90">
          severity: critical · service: auth-api
        </p>
        <p className="text-[#6ee7b7]">→ incident opened · owner assigned</p>
      </div>
    );
  }
  if (kind === "approval") {
    return (
      <div className="mt-4 space-y-2">
        <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-[10px] font-medium text-amber-200/95">
          Awaiting approval · isolate-segment
        </p>
        <div className="flex gap-2">
          <span className="h-7 flex-1 rounded-md border border-white/[0.08] bg-white/[0.04]" />
          <span className="flex h-7 w-20 items-center justify-center rounded-md bg-accent/25 text-[10px] font-semibold text-accent">
            Approve
          </span>
        </div>
      </div>
    );
  }
  return (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-white/[0.08] bg-black/50 p-2 font-mono text-[9px] leading-relaxed text-foreground/75">
      {`approval.recorded\nautomation.dry_run ok\nautomation.executed`}
    </pre>
  );
}

export function WorkflowShowcase() {
  return (
    <MarketingReveal
      id="workflow"
      className={`${mSectionTight} zentro-quantum-section`}
      aria-labelledby="workflow-heading"
    >
      <div className={mContainer}>
        <p className={`${mEyebrow} zentro-eyebrow-cyber`}>Workflow preview</p>
        <h2 id="workflow-heading" className={`zentro-living-headline mt-2 ${mH2}`}>
          See how a change moves through Zentro
        </h2>
        <p className={mLede}>
          Illustrative UI — not live customer data. The same flow runs in your workspace after sign-in.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {WORKFLOWS.map((item) => (
            <article key={item.title} className="zentro-bento-cell rounded-2xl p-5 sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-wide text-accent/80">{item.caption}</p>
              <h3 className={`mt-2 ${mCardTitle}`}>{item.title}</h3>
              <p className={`mt-2 ${mBody}`}>{item.body}</p>
              <WorkflowMock kind={item.kind} />
            </article>
          ))}
        </div>
      </div>
    </MarketingReveal>
  );
}
