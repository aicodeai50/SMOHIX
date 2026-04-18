import Link from "next/link";

const modules = [
  {
    title: "Incident Copilot",
    href: "/copilot",
    description:
      "Guided triage, hypotheses, and next steps grounded in your signals — with human oversight at every critical decision.",
    points: ["Alert correlation", "Suggested runbooks", "Evidence trails"],
  },
  {
    title: "Automation Engine",
    href: "/automations",
    description:
      "Execute playbooks across your stack with policy checks, dry-runs, and mandatory approvals for risky changes.",
    points: ["Approval workflows", "Environment guardrails", "Idempotent actions"],
  },
  {
    title: "Runbook Intelligence",
    href: "/runbooks",
    description:
      "Turn static docs into living procedures: versioned steps, drift detection, and continuous improvement from outcomes.",
    points: ["Version history", "Step-level checks", "Post-incident learning"],
  },
];

export function ModuleGrid() {
  return (
    <section id="modules" className="border-b border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Three pillars
        </h2>
        <p className="mt-3 max-w-2xl text-muted">
          Built for enterprise IT: fast when you need speed, strict when you need
          safety.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {modules.map((m) => (
            <article
              key={m.title}
              className="flex flex-col rounded-xl border border-border bg-surface/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
            >
              <h3 className="text-lg font-semibold text-foreground">{m.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                {m.description}
              </p>
              <ul className="mt-6 space-y-2 border-t border-border pt-4 font-mono text-xs text-muted">
                {m.points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="text-accent">▸</span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href={m.href}
                className="mt-5 inline-flex text-sm font-medium text-accent hover:underline"
              >
                Open in console →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
