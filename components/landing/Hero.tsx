import Link from "next/link";
import { getTrialHref } from "@/lib/billing";

export function Hero() {
  const trialHref = getTrialHref();
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.15),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="mb-4 inline-flex rounded-full border border-border bg-surface-elevated/80 px-3 py-1 text-xs font-medium uppercase tracking-wider text-accent">
          Platform
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.1]">
          AI operations command center
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Unify reasoning and execution: investigate incidents with an AI copilot,
          ship automations with approval gates, and keep every action audit-ready
          for your IT org.
        </p>
        <div className="mt-10 flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 text-base font-medium text-background transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/auth/sign-in"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-6 text-base font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-surface-elevated/50"
            >
              Sign in
            </Link>
          </div>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <a href="#modules" className="text-foreground underline-offset-4 hover:text-accent hover:underline">
              View modules
            </a>
            <span className="text-muted/40" aria-hidden>
              ·
            </span>
            <a
              href={trialHref}
              className="underline-offset-4 hover:text-accent hover:underline"
            >
              Subscribe (trial)
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
