import Link from "next/link";

import { AppIcon } from "@/components/icons/AppIcon";
import {
  mBody,
  mCardLink,
  mCardTitle,
  mContainer,
  mH2,
  mLede,
  mSection,
  mSectionEnter,
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
  },
  {
    title: "Automation Engine",
    href: "/automations",
    description:
      "Playbooks with dry-runs and approvals before changes leave the controlled path.",
    points: ["Approval workflows", "Environment guardrails", "Idempotent actions"],
    cta: "Automations",
  },
  {
    title: "Runbook Intelligence",
    href: "/runbooks",
    description:
      "Versioned procedures and checks, updated as you learn from incidents.",
    points: ["Version history", "Step-level checks", "Post-incident learning"],
    cta: "Runbooks",
  },
];

export function ModuleGrid() {
  return (
    <section id="modules" className={`${mSection} ${mSectionEnter}`}>
      <div className={mContainer}>
        <h2 className={mH2}>Modules</h2>
        <p className={mLede}>
          Three lenses on the same spine: triage with Copilot, change with guarded automations,
          procedure with runbooks — each opens in the console on its own route.
        </p>
        <div className={`mt-10 grid gap-5 md:grid-cols-3 ${mStaggerGrid}`}>
          {modules.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className={mCardLink}
            >
              <h3 className={mCardTitle}>{m.title}</h3>
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
    </section>
  );
}
