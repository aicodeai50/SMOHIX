const feed = [
  {
    time: "14:02:11",
    kind: "approval",
    text: "Scale API tier — pending approval (SRE)",
  },
  { time: "14:01:44", kind: "action", text: "Dry-run: restart worker pool (staging)" },
  { time: "14:00:02", kind: "signal", text: "Latency SLO breach detected — us-east" },
];

export function LivePanel() {
  return (
    <section id="operations" className="border-b border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Operational feed
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              A live-style panel for signals, proposed actions, and approval
              queues — the rhythm of a modern ops floor.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Systems nominal
          </span>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-surface font-mono text-sm lg:col-span-3">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-muted">
              <span>stream / incidents</span>
              <span>UTC</span>
            </div>
            <ul className="divide-y divide-border">
              {feed.map((row) => (
                <li key={row.time + row.text} className="flex gap-4 px-4 py-3">
                  <span className="shrink-0 text-muted">{row.time}</span>
                  <span
                    className={
                      row.kind === "approval"
                        ? "text-amber-300/90"
                        : row.kind === "action"
                          ? "text-accent"
                          : "text-muted"
                    }
                  >
                    [{row.kind}]
                  </span>
                  <span className="text-foreground/90">{row.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="space-y-4 rounded-xl border border-border bg-surface-elevated/60 p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Approvals
            </h3>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm font-medium text-foreground">
                Production change
              </p>
              <p className="mt-1 text-xs text-muted">
                Increase DB connection limit — requires two-person rule
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-md bg-emerald-600/90 py-2 text-xs font-medium text-white"
                  disabled
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-md border border-border py-2 text-xs font-medium text-muted"
                  disabled
                >
                  Deny
                </button>
              </div>
            </div>
            <p className="text-xs text-muted">
              Demo UI — wire to your approval service and audit store.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
