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
        <h1 className="shynvo-headline max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl sm:leading-tight md:text-[2.5rem]">
          Operations control for IT teams
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Incident response, guarded automation, and auditable change — in one console with
          consistent policy and organization sign-in when your team enables it.
        </p>
        <div className="mt-9">
          <Link
            href="/hub"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Open console
          </Link>
        </div>
        <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <a href="#modules" className="text-foreground/90 underline-offset-4 hover:text-accent hover:underline">
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
