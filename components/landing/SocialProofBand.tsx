import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { mBody, mContainer, mEyebrow } from "@/lib/marketing-layout";

const ROLES = ["Platform engineering", "SOC operations", "SRE & reliability", "GRC & compliance"] as const;

const INTEGRATIONS = ["Datadog", "PagerDuty", "Slack", "Splunk", "Prometheus", "HTTP ingest"] as const;

const QUOTES = [
  {
    quote:
      "We needed automations that stop at an approval gate — not scripts that touch production silently.",
    role: "Platform lead",
  },
  {
    quote:
      "Incident timeline, dry-runs, and audit export in one place — that is what our post-incident reviews were missing.",
    role: "SOC manager",
  },
] as const;

export function SocialProofBand() {
  return (
    <MarketingReveal className="border-b border-white/[0.06] py-10 sm:py-12 zentro-quantum-section">
      <div className={mContainer}>
        <p className={`${mEyebrow} text-center zentro-eyebrow-cyber`}>
          Trusted by teams building reliable automation
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {ROLES.map((role) => (
            <li
              key={role}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-foreground/85"
            >
              {role}
            </li>
          ))}
        </ul>

        <p className={`${mBody} mt-8 text-center text-xs uppercase tracking-[0.14em] text-muted`}>
          Supported ingest &amp; connector shapes
        </p>
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {INTEGRATIONS.map((name) => (
            <li key={name} className="font-mono text-[11px] text-muted/90">
              {name}
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {QUOTES.map((item) => (
            <blockquote
              key={item.role}
              className="zentro-bento-cell rounded-2xl p-5 sm:p-6"
            >
              <p className="text-sm leading-relaxed text-foreground/90">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-3 text-xs font-medium text-muted">— {item.role}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </MarketingReveal>
  );
}
