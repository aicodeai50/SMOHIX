import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import { MarketingReveal } from "@/components/marketing/MarketingReveal";
import {
  mBody,
  mCardLink,
  mCardTitle,
  mContainer,
  mH2,
  mLede,
  mSection,
  mStaggerGrid,
} from "@/lib/marketing-layout";

const modules = [
  {
    title: "Incident Copilot",
    href: "/copilot",
    description:
      "Structured triage and suggested next steps from connected signals, with explicit human checkpoints.",
    points: ["Alert correlation", "Suggested runbooks", "Evidence handoff"],
    cta: "Copilot",
    icon: "bot" as const,
  },
  {
    title: "Threat & exposure",
    href: "/auth/sign-in?next=/assets/certificates",
    description:
      "Certificate hygiene, secrets rotation, and prioritized exposure findings tied to services and owners.",
    points: ["Cert expiry radar", "Secrets vault", "Drift signals"],
    cta: "Assets",
    icon: "shieldCheck" as const,
  },
  {
    title: "Network defense",
    href: "/auth/sign-in?next=/assets/network",
    description:
      "Device inventory, config snapshots, and drift detection — linked to incidents and remediation.",
    points: ["Config baselines", "Drift findings", "Segment isolation"],
    cta: "Network",
    icon: "server" as const,
  },
  {
    title: "Automation Engine",
    href: "/automations",
    description:
      "Playbooks with dry-runs and approvals before changes leave the controlled path.",
    points: ["Approval workflows", "Risk scoring", "Idempotent actions"],
    cta: "Automations",
    icon: "workflow" as const,
  },
  {
    title: "Governance & access",
    href: "/auth/sign-in?next=/governance/access",
    description:
      "Access posture snapshots, MFA coverage, and policy rules that gate high-risk execution.",
    points: ["MFA coverage", "Policy blocks", "Reviewer notes"],
    cta: "Governance",
    icon: "keyRound" as const,
  },
  {
    title: "Runbook Intelligence",
    href: "/runbooks",
    description:
      "Versioned procedures and checks, updated as you learn from incidents and pen tests.",
    points: ["Version history", "Step-level checks", "Post-incident learning"],
    cta: "Runbooks",
    icon: "bookOpen" as const,
  },
];

export function ModuleGrid() {
  return (
    <MarketingReveal id="modules" className={mSection}>
      <div className={mContainer}>
        <h2 className={mH2}>Platform modules</h2>
        <p className={mLede}>
          Operations and security in one spine — triage, scan, govern, automate, and prove every
          high-impact action from the same console.
        </p>
        <div className={`mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${mStaggerGrid}`}>
          {modules.map((m) => (
            <Link key={m.title} href={m.href} className={mCardLink}>
              <div className="flex items-center gap-2">
                <AppIcon name={m.icon} size={18} className="text-accent/80" />
                <h3 className={mCardTitle}>{m.title}</h3>
              </div>
              <p className={`mt-2 flex-1 ${mBody}`}>{m.description}</p>
              <ul className="mt-5 space-y-1.5 border-t border-white/[0.06] pt-4 text-xs text-muted">
                {m.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <AppIcon name="dot" size={6} className="mt-1.5 text-foreground/35" aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-4 text-sm font-medium text-accent/95 group-hover:underline">
                {m.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </MarketingReveal>
  );
}
