import Link from "next/link";
import { getTrialHref } from "@/lib/billing";

export function Hero({
  signedInCheckoutUrl,
}: {
  signedInCheckoutUrl?: string | null;
}) {
  const trialHref = signedInCheckoutUrl?.trim() || getTrialHref();
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-25%,rgba(94,225,255,0.14),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_20%,rgba(129,140,248,0.1),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <p className="mb-5 inline-flex rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent shadow-[0_0_24px_-8px_rgba(94,225,255,0.25)] backdrop-blur-sm">
          Platform
        </p>
        <h1 className="shynvo-headline max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.08]">
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
              className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 text-base font-semibold text-background shadow-[0_0_32px_-8px_rgba(94,225,255,0.45)] transition-[opacity,box-shadow] hover:opacity-95 hover:shadow-[0_0_40px_-6px_rgba(94,225,255,0.55)]"
            >
              Get started
            </Link>
            <Link
              href="/auth/sign-in"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 text-base font-medium text-foreground backdrop-blur-sm transition-colors hover:border-accent/45 hover:bg-white/[0.06]"
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
              {...(trialHref.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {signedInCheckoutUrl ? "Subscribe (your account)" : "Subscribe (trial)"}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
