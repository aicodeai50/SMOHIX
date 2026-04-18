import Link from "next/link";
import { getTrialHref } from "@/lib/billing";
import { marketingCta } from "@/lib/marketing-copy";

export function ConnectCTA({
  signedInCheckoutUrl,
}: {
  signedInCheckoutUrl?: string | null;
}) {
  const trialHref = signedInCheckoutUrl?.trim() || getTrialHref();
  return (
    <section id="connect" className="py-16 sm:py-20" aria-labelledby="connect-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="shynvo-glass relative overflow-hidden rounded-2xl px-6 py-10 sm:px-10 sm:py-12">
          <div className="relative max-w-2xl">
            <h2
              id="connect-heading"
              className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
            >
              Integrations and console
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Reasoning and automation are available in the same application after you sign in.
              Integration details are managed from Settings.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted">
              <li>
                <Link href="/copilot" className="text-foreground/85 hover:text-accent hover:underline">
                  Copilot
                </Link>
                <span className="text-muted"> — incident triage and chat</span>
              </li>
              <li>
                <Link href="/automations" className="text-foreground/85 hover:text-accent hover:underline">
                  Automations
                </Link>
                <span className="text-muted"> — playbooks and dry-runs</span>
              </li>
            </ul>
            <div id="trial" className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link
                href="/hub"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                {marketingCta.connectExplore}
              </Link>
              <a
                href={trialHref}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-dashed border-white/[0.12] bg-transparent px-5 text-sm font-medium text-muted transition-colors hover:border-white/[0.2] hover:text-foreground"
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
