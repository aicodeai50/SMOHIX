import Link from "next/link";

import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mContainer,
  mFooterLabel,
  mH2Sm,
  mLede,
  mPanelShell,
  mSectionTight,
  mStaggerGrid,
} from "@/lib/marketing-layout";

const SAMPLE = `{
  "event_type": "automation.dry_run_recorded",
  "details": {
    "incident_id": "a1b2c3d4-...",
    "playbook_id": "pb-restart-workers",
    "result": "ok"
  }
}`;

export function ProofStrip() {
  return (
    <MarketingReveal
      id="proof"
      className={mSectionTight}
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
              Capture approvals, status changes, and automation evidence in one audit-oriented record
              so teams can review what changed, who approved it, and when it happened.
            </p>
            <Link
              href="/auth/sign-in?next=/audit"
              className="mt-4 inline-block text-[0.9375rem] font-medium leading-relaxed text-accent hover:underline"
            >
              Preview after sign-in →
            </Link>
          </div>
          <div className="min-w-0 flex-1 md:max-w-xl">
            <p className={mFooterLabel}>Event format preview</p>
            <pre
              className={`mt-2 overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-foreground/85 sm:text-xs ${mPanelShell} bg-black/40`}
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
