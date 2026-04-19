const STEPS = [
  {
    n: "1",
    title: "Incident detected",
    body: "Monitoring webhook, HTTP ingest token, or a responder opens an incident manually — one controlled record.",
  },
  {
    n: "2",
    title: "Shynvo loads a controlled workflow",
    body: "Assign owner, link a service, attach a versioned runbook — everyone sees the same checklist.",
  },
  {
    n: "3",
    title: "Suggested automation appears",
    body: "Playbooks (and Copilot triage) propose the next mechanical step — still read-only until you promote it.",
  },
  {
    n: "4",
    title: "Approval required",
    body: "High-risk actions wait for an explicit approval record — today per workspace; scoped approver roles on the roadmap.",
  },
  {
    n: "5",
    title: "Automation runs through your connectors",
    body: "Execution only after dry-run review and policy you configure; automatic rollback hooks are roadmap, not marketing fluff.",
  },
  {
    n: "6",
    title: "Everything is logged",
    body: "Status, approvals, and automation-related events land in the activity log — plus incident export where enabled.",
  },
] as const;

const GUARDED = [
  "Nothing irreversible runs straight from chat — dry-run or human checkpoint first.",
  "Approvals and status transitions are written for audit, not buried in DMs.",
  "Connectors are yours — Shynvo does not silently phone home to your cloud APIs.",
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
          Read this like a storyboard — each step maps to a real route in the console today unless
          called out as roadmap.
        </p>

        <p className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-mono text-[11px] leading-relaxed text-foreground/85 sm:text-xs">
          <span className="text-muted">Example:</span> server signal → incident opens → runbook +
          Copilot → dry-run playbook → approval recorded → execute via connector → audit + export
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
              Why &ldquo;guarded&rdquo;?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Automation that never skips the control plane you can show in review:
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
          </aside>
        </div>
      </div>
    </section>
  );
}
