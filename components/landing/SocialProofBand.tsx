import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import { mBody, mContainer, mEyebrow } from "@/lib/marketing-layout";

const ROLES = ["Platform engineering", "SRE & reliability", "SOC operations", "GRC & compliance"] as const;

const INTEGRATIONS = ["HTTP ingest", "Slack webhooks", "Datadog payloads", "PagerDuty payloads", "Prometheus alerts", "Custom scripts"] as const;

const CAPABILITIES = [
  {
    title: "Human approval before high-impact action",
    body: "Dry-runs, policy checks, and approval notes are captured before remediation is recorded.",
  },
  {
    title: "One evidence trail",
    body: "Incidents, owner changes, automation runs, Copilot context, and exports share the same audit spine.",
  },
] as const;

export function SocialProofBand() {
  return (
    <MarketingReveal className="border-b border-white/[0.06] py-10 sm:py-12 zentro-quantum-section">
      <div className={mContainer}>
        <p className={`${mEyebrow} text-center zentro-eyebrow-cyber`}>
          Built for accountable operations teams
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
          Available today: ingest and webhook paths
        </p>
        <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {INTEGRATIONS.map((name) => (
            <li key={name} className="font-mono text-[11px] text-muted/90">
              {name}
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {CAPABILITIES.map((item) => (
            <section
              key={item.title}
              className="zentro-bento-cell rounded-2xl p-5 sm:p-6"
            >
              <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </section>
          ))}
        </div>
      </div>
    </MarketingReveal>
  );
}
