import Link from "next/link";
import { getTrialHref } from "@/lib/billing";

export function ConnectCTA() {
  const trialHref = getTrialHref();
  return (
    <section id="connect" className="py-20 sm:py-24" aria-labelledby="connect-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-elevated px-6 py-12 sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2
              id="connect-heading"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Connect your services
            </h2>
            <p className="mt-3 text-muted">
              Link reasoning for analysis and automation for execution — one control
              plane, consistent policies, one audit trail.
            </p>
            <ul className="mt-6 space-y-2 font-mono text-sm text-muted">
              <li>
                <span className="text-accent">→</span> Reasoning (Copilot)
              </li>
              <li>
                <span className="text-accent">→</span> Automation (workflows)
              </li>
            </ul>
            <div id="trial" className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/auth/sign-up"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 font-medium text-background hover:opacity-90"
              >
                Get started
              </Link>
              <Link
                href="/auth/sign-in"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-6 font-medium text-foreground hover:border-accent/40"
              >
                Sign in
              </Link>
              <Link
                href="/copilot"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-6 font-medium text-foreground hover:border-accent/40"
              >
                Open console
              </Link>
              <a
                href={trialHref}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-dashed border-border px-6 font-medium text-muted hover:border-accent/40 hover:text-foreground"
              >
                Subscribe (trial)
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
