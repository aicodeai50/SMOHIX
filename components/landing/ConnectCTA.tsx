import Link from "next/link";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { getTrialHref } from "@/lib/billing";
import { marketingCta } from "@/lib/marketing-copy";
import { mBody, mContainer, mEyebrow, mH2 } from "@/lib/marketing-layout";

export function ConnectCTA({
  signedInCheckoutUrl,
  signedInTeamCheckoutUrl,
}: {
  signedInCheckoutUrl?: string | null;
  signedInTeamCheckoutUrl?: string | null;
}) {
  const trialHref = signedInCheckoutUrl?.trim() || getTrialHref();
  const teamHref = signedInTeamCheckoutUrl?.trim();
  return (
    <MarketingReveal
      id="connect"
      className="py-16 sm:py-20"
      aria-labelledby="connect-heading"
    >
      <div className={mContainer}>
        <div className="zentro-neural-field zentro-holo-panel relative overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-12">
          <div className="zentro-scan-sweep pointer-events-none absolute inset-0 opacity-30" aria-hidden />
          <div className="relative max-w-2xl">
            <p className={`${mEyebrow} zentro-eyebrow-cyber`}>Ready when you are</p>
            <h2 id="connect-heading" className={`mt-2 ${mH2}`}>
              One workspace for ops, security, and proof
            </h2>
            <p className={`mt-2 ${mBody}`}>
              Sign in to the command console — or explore{" "}
              <Link href="/integrations" className="font-medium text-accent hover:underline">
                integrations
              </Link>
              ,{" "}
              <Link href="/next" className="font-medium text-accent hover:underline">
                the roadmap
              </Link>
              , and{" "}
              <Link href="/changelog" className="font-medium text-accent hover:underline">
                changelog
              </Link>
              .
            </p>
            <div id="trial" className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link
                href="/hub"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background shadow-[0_0_24px_-8px_var(--accent-glow)] transition-opacity hover:opacity-90"
              >
                {marketingCta.connectExplore}
              </Link>
              <Link
                href="/enterprise"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] px-5 text-sm font-medium text-foreground/90 hover:border-accent/35"
              >
                Enterprise
              </Link>
              <a
                href={trialHref}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-dashed border-white/[0.12] bg-transparent px-5 text-sm font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-foreground"
                {...(trialHref.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {signedInCheckoutUrl ? "Subscribe — Pro" : "Subscribe (trial)"}
              </a>
              {teamHref ? (
                <a
                  href={teamHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-dashed border-white/[0.12] bg-transparent px-5 text-sm font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-foreground"
                >
                  Subscribe — Team
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </MarketingReveal>
  );
}
