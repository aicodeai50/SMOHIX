import Link from "next/link";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { getTrialHref } from "@/lib/billing";
import { mBody, mContainer, mEyebrow, mH1, mHeroLede } from "@/lib/marketing-layout";

const capabilityPills = [
  "Incident command",
  "Threat surface",
  "Exposure scans",
  "Access posture",
  "Guarded automation",
  "Audit evidence",
] as const;

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
    <MarketingReveal className="zentro-hero-future relative overflow-hidden border-b border-white/[0.06]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(94,225,255,0.1),transparent)]"
        aria-hidden
      />
      <div className={`relative py-16 sm:py-24 lg:py-28 ${mContainer}`}>
        <p className={`${mEyebrow} zentro-eyebrow-cyber`}>Operations · Security · Enterprise</p>
        <h1 className={`shynvo-headline mt-3 max-w-4xl ${mH1}`}>
          The command platform for incidents, cybersecurity, and guarded change
        </h1>
        <p className={mHeroLede}>
          <span className="text-foreground/90">
            Zentro unifies incident response, threat visibility, exposure scanning, and penetration
            workflows in one future-ready control plane — built for teams that cannot afford silent
            automation or missing evidence.
          </span>
        </p>
        <p className={`mt-3 max-w-2xl ${mBody}`}>
          From alert intake to approved remediation: correlate signals, map attack surface, run
          guarded playbooks, and export audit-grade proof — the way Fortune-scale security and
          platform teams actually operate.
        </p>

        <ul className="mt-8 flex flex-wrap gap-2" aria-label="Platform capabilities">
          {capabilityPills.map((pill) => (
            <li
              key={pill}
              className="rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-wide text-foreground/85 backdrop-blur-sm"
            >
              {pill}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/auth/sign-in?next=/hub"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background shadow-[0_0_32px_-8px_var(--accent-glow)] transition-opacity hover:opacity-90"
          >
            Launch command workspace
          </Link>
          <Link
            href="/cybersecurity"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--cyber)_45%,transparent)] bg-[var(--cyber-dim)] px-5 text-sm font-medium text-foreground/90 transition-colors hover:border-[var(--cyber)] hover:text-foreground"
          >
            Cybersecurity overview
          </Link>
          <Link
            href="/enterprise"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] px-5 text-sm font-medium text-foreground/90 transition-colors hover:border-accent/35 hover:text-accent"
          >
            Enterprise
          </Link>
        </div>

        <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
          <Link href="/platform" className="underline-offset-4 hover:text-accent hover:underline">
            Platform map
          </Link>
          <span className="text-muted/35" aria-hidden>
            ·
          </span>
          <a href="#preview" className="underline-offset-4 hover:text-accent hover:underline">
            Command preview
          </a>
          <span className="text-muted/35" aria-hidden>
            ·
          </span>
          <a href="#cyber" className="underline-offset-4 hover:text-accent hover:underline">
            Security ops
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
            {signedInCheckoutUrl ? "Subscribe (Pro)" : "Start trial"}
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
    </MarketingReveal>
  );
}
