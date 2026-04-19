import Link from "next/link";

const SAMPLE = `{
  "event_type": "incident.context_updated",
  "details": { "incident_id": "a1b2c3d4-…" }
}`;

export function ProofStrip() {
  return (
    <section
      id="proof"
      className="border-b border-white/[0.06] py-12 sm:py-14"
      aria-labelledby="proof-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:justify-between md:gap-10">
          <div className="min-w-0 md:max-w-md">
            <h2
              id="proof-heading"
              className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
            >
              Evidence you can show auditors
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The activity log is append-oriented: billing webhooks, API keys, approvals, status
              changes, and automation events in one place. Export paths grow with your plan.
            </p>
            <Link
              href="/auth/sign-in?next=/audit"
              className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
            >
              Preview after sign-in →
            </Link>
          </div>
          <div className="min-w-0 flex-1 md:max-w-xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
              Example shape (illustrative)
            </p>
            <pre
              className="mt-2 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/40 p-4 font-mono text-[11px] leading-relaxed text-foreground/85 sm:text-xs"
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
