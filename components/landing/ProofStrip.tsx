import Link from "next/link";

import {
  mContainer,
  mFooterLabel,
  mH2Sm,
  mLede,
  mPanelShell,
  mSectionEnter,
  mSectionTight,
  mStaggerGrid,
} from "@/lib/marketing-layout";

const SAMPLE = `{
  "event_type": "incident.context_updated",
  "details": { "incident_id": "a1b2c3d4-…" }
}`;

export function ProofStrip() {
  return (
    <section
      id="proof"
      className={`${mSectionTight} ${mSectionEnter}`}
      aria-labelledby="proof-heading"
    >
      <div className={mContainer}>
        <div
          className={`flex flex-col gap-6 md:flex-row md:items-stretch md:justify-between md:gap-10 ${mStaggerGrid}`}
        >
          <div className="min-w-0 md:max-w-md">
            <h2 id="proof-heading" className={mH2Sm}>
              Evidence you can show auditors
            </h2>
            <p className={mLede}>
              The activity log is append-oriented: billing webhooks, API keys, approvals, status
              changes, and automation events in one place. Export paths grow with your plan.
            </p>
            <Link
              href="/auth/sign-in?next=/audit"
              className="mt-4 inline-block text-[0.9375rem] font-medium leading-relaxed text-accent hover:underline"
            >
              Preview after sign-in →
            </Link>
          </div>
          <div className="min-w-0 flex-1 md:max-w-xl">
            <p className={mFooterLabel}>Example shape (illustrative)</p>
            <pre
              className={`mt-2 overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-foreground/85 sm:text-xs ${mPanelShell} bg-black/40`}
              tabIndex={0}
            >
              {SAMPLE}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
