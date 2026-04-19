import Link from "next/link";
import { getTrialHref } from "@/lib/billing";

export function Hero({
  signedInCheckoutUrl,
  signedInTeamCheckoutUrl,
}: {
  signedInCheckoutUrl?: string | null;
  signedInTeamCheckoutUrl?: string | null;
}) {
  const trialHref = signedInCheckoutUrl?.trim() || getTrialHref();
  const teamHref = signedInTeamCheckoutUrl?.trim();
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(94,225,255,0.08),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90">
          Category
        </p>
        <h1 className="shynvo-headline mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl sm:leading-tight md:text-[2.5rem]">
          Safe automation for IT operations
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          <span className="text-foreground/90">Incident response, guarded change, and an auditable
          trail</span> — in one console. A safety layer on top of the automations you already run,
          not a vague &ldquo;AI platform.&rdquo;
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          vs legacy paging: we are not claiming full on-call replacement on day one. vs ITSM
          suites: we are not claiming enterprise change modules yet. We are claiming{" "}
          <strong className="font-medium text-foreground/90">approval-first execution with proof</strong>.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/hub"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Open console
          </Link>
          <Link
            href="/auth/sign-in?next=/incidents/new"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] px-5 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/35 hover:text-accent"
          >
            Start: open an incident
          </Link>
          <Link
            href="/auth/sign-in?next=/settings"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-transparent px-5 text-sm font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-foreground"
          >
            Connect alert ingest
          </Link>
          <Link
            href="/auth/sign-in?next=/runbooks"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-transparent px-5 text-sm font-medium text-muted underline-offset-4 hover:text-accent hover:underline"
          >
            Browse runbooks
          </Link>
        </div>

        <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <a href="#preview" className="text-foreground/90 underline-offset-4 hover:text-accent hover:underline">
            See the UI
          </a>
          <span className="text-muted/35" aria-hidden>
            ·
          </span>
          <a href="#modules" className="underline-offset-4 hover:text-accent hover:underline">
            Modules
          </a>
          <span className="text-muted/35" aria-hidden>
            ·
          </span>
          <a
            href={trialHref}
            className="underline-offset-4 hover:text-accent hover:underline"
            {...(trialHref.startsWith("http")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {signedInCheckoutUrl ? "Subscribe (Pro)" : "Billing / trial"}
          </a>
          {teamHref ? (
            <>
              <span className="text-muted/35" aria-hidden>
                ·
              </span>
              <a
                href={teamHref}
                className="underline-offset-4 hover:text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Team checkout
              </a>
            </>
          ) : null}
        </p>
      </div>
    </section>
  );
}
