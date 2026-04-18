import Link from "next/link";

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
    <section id="modules" className="border-b border-white/[0.06] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Capabilities
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Copilot, automation, and runbooks — each area opens in the console on its own route.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className="group flex flex-col rounded-lg border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.035]"
            >
              <h3 className="text-base font-semibold text-foreground">{m.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{m.description}</p>
              <ul className="mt-5 space-y-1.5 border-t border-white/[0.06] pt-4 text-xs text-muted">
                {m.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-foreground/35" aria-hidden>
                      ·
                    </span>
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
