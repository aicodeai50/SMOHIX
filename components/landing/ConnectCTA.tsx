import Link from "next/link";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { marketingCta } from "@/lib/marketing-copy";
import { mBody, mContainer, mEyebrow, mH2 } from "@/lib/marketing-layout";

/**
 * Homepage / landing connect panel.
 * Self-serve checkout is deferred — paid CTAs route to contact / pilot, not payment flows.
 */
export function ConnectCTA(_props?: {
  /** @deprecated Ignored while public checkout is deferred */
  signedInCheckoutUrl?: string | null;
  /** @deprecated Ignored while public checkout is deferred */
  signedInTeamCheckoutUrl?: string | null;
}) {
  return (
    <MarketingReveal
      id="connect"
      className="py-16 sm:py-20 smohix-quantum-section"
      aria-labelledby="connect-heading"
    >
      <div className={mContainer}>
        <div className="smohix-neural-field smohix-holo-panel smohix-quantum-core relative overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-12">
          <div className="smohix-dimension-rift pointer-events-none absolute inset-0 opacity-25" aria-hidden />
          <div className="smohix-scan-sweep pointer-events-none absolute inset-0 opacity-30" aria-hidden />
          <div className="relative max-w-2xl">
            <p className={`${mEyebrow} smohix-eyebrow-cyber`}>⟡ Get started</p>
            <h2 id="connect-heading" className={`smohix-living-headline mt-2 ${mH2}`}>
              Open the operational console
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
              . Self-serve subscriptions are coming soon.
            </p>
            <div id="trial" className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link
                href="/hub"
                className="smohix-launch-beacon inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background shadow-[0_0_24px_-8px_var(--accent-glow)] transition-opacity hover:opacity-90"
              >
                {marketingCta.connectExplore}
              </Link>
              <Link
                href="/enterprise"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.03] px-5 text-sm font-medium text-foreground/90 hover:border-accent/35"
              >
                Enterprise
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-dashed border-white/[0.12] bg-transparent px-5 text-sm font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-foreground"
              >
                Contact us
              </Link>
              <Link
                href="/pilot"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-dashed border-white/[0.12] bg-transparent px-5 text-sm font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-foreground"
              >
                Start a pilot
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingReveal>
  );
}
