const CASES = [
  {
    title: "Restart failing services with approval",
    body: "Wire a playbook, dry-run impact, get a recorded approval, then execute through your automation connector.",
  },
  {
    title: "Rollback or mitigate bad deployments",
    body: "Pair Copilot checklists with automation dry-runs so the team agrees on the smallest safe step before touching prod.",
  },
  {
    title: "Handle alerts with controlled automation",
    body: "HTTP ingest opens or dedupes incidents; responders link runbooks and only then promote actions out of simulation.",
  },
  {
    title: "Track every production change",
    body: "Keep status, approvals, and automation events in one audit trail — export incident notes when compliance asks.",
  },
] as const;

export function UseCasesSection() {
  return (
    <section
      id="use-cases"
      className="border-b border-white/[0.06] py-16 sm:py-20"
      aria-labelledby="use-cases-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="use-cases-heading"
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          Concrete outcomes
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          If it sounds like a slide deck, it fails. These are the jobs teams hire a control layer
          for — phrased the way your engineers talk.
        </p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {CASES.map((c) => (
            <li
              key={c.title}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6"
            >
              <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
