import Link from "next/link";
import { getTrialHref } from "@/lib/billing";

export function ConnectCTA({
  signedInCheckoutUrl,
}: {
  signedInCheckoutUrl?: string | null;
}) {
  const trialHref = signedInCheckoutUrl?.trim() || getTrialHref();
  return (
    <section id="connect" className="py-20 sm:py-24" aria-labelledby="connect-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="shynvo-glass relative overflow-hidden rounded-3xl px-6 py-12 sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2
              id="connect-heading"
              className="shynvo-headline text-2xl font-semibold tracking-tight sm:text-3xl"
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
                className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 font-semibold text-background shadow-[0_0_28px_-8px_rgba(94,225,255,0.45)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_36px_-6px_rgba(94,225,255,0.55)]"
              >
                Get started
              </Link>
              <Link
                href="/auth/sign-in"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] px-6 font-medium text-foreground transition-[border-color,box-shadow] hover:border-accent/35 hover:shadow-[0_0_24px_-12px_rgba(94,225,255,0.2)]"
              >
                Sign in
              </Link>
              <Link
                href="/copilot"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.02] px-6 font-medium text-foreground transition-[border-color,box-shadow] hover:border-accent/35 hover:shadow-[0_0_24px_-12px_rgba(94,225,255,0.2)]"
              >
                Open console
              </Link>
              <a
                href={trialHref}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-dashed border-white/[0.14] bg-white/[0.02] px-6 font-medium text-muted transition-[border-color,color] hover:border-accent/35 hover:text-foreground"
                {...(trialHref.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {signedInCheckoutUrl ? "Subscribe (your account)" : "Subscribe (trial)"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
