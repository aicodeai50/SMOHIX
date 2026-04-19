const STEPS = [
  {
    n: "1",
    title: "Signal becomes an incident",
    body: "Pager, webhook, or manual open — one record with severity, owner, and linked service.",
  },
  {
    n: "2",
    title: "Triage with checkpoints",
    body: "Copilot proposes structured next steps; humans confirm before anything mutates production.",
  },
  {
    n: "3",
    title: "Runbook guides response",
    body: "Versioned checks link from the incident so responders stay aligned under stress.",
  },
  {
    n: "4",
    title: "Dry-run automation first",
    body: "Playbooks simulate side effects so the team sees blast radius before execution.",
  },
  {
    n: "5",
    title: "Approval gate (when required)",
    body: "High-risk changes wait for an explicit decision — recorded, not buried in chat.",
  },
  {
    n: "6",
    title: "Controlled execution",
    body: "Automation runs only through configured connectors and policies you own.",
  },
  {
    n: "7",
    title: "Append-only audit",
    body: "Status, approvals, and automation events land in one log for review and export.",
  },
  {
    n: "8",
    title: "Close the loop",
    body: "Postmortem notes and markdown export support blameless review and compliance handoff.",
  },
] as const;

const GUARDED = [
  "Dry-run or simulate before irreversible side effects.",
  "Human approval where your policy says it is required — decisions are auditable.",
  "Execution and outcomes are written to the activity log, not only console output.",
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-b border-white/[0.06] py-16 sm:py-20"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="how-heading"
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          How Shynvo runs an incident
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          IT teams buy flows, not scattered features. This is the spine from signal to defensible
          closure — Copilot, runbooks, and automation on one path.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_minmax(0,20rem)] lg:items-start">
          <ol className="space-y-6">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/35 bg-accent/10 text-xs font-semibold text-accent"
                  aria-hidden
                >
                  {step.n}
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <aside className="shynvo-glass rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-accent/90">
              Guarded automation
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Not a buzzword — a contract for how change leaves the building:
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/90">
              {GUARDED.map((line) => (
                <li key={line} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-muted">
              Maturity model: start with audit + approvals, add connector-backed automation when
              your team is ready — no false promise of unsupervised self-healing.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
