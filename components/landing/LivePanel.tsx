import Link from "next/link";

import { getConnectorHealthRows } from "@/lib/connectors-health";

type FeedRow = { time: string; kind: string; text: string };

const STATIC_FEED: FeedRow[] = [
  {
    time: "14:02:11",
    kind: "approval",
    text: "Scale API tier — pending approval (SRE)",
  },
  { time: "14:01:44", kind: "action", text: "Dry-run: restart worker pool (staging)" },
  { time: "14:00:02", kind: "signal", text: "Latency SLO breach detected — us-east" },
];

/** Marketing operational feed — mixes live connector probes with sample stream rows. */
export async function LivePanel() {
  const connectors = await getConnectorHealthRows();
  const now = new Date();
  const stamp = now.toISOString().slice(11, 19);

  const dynamic: FeedRow[] = [];
  for (const c of connectors) {
    if (c.ok === null) {
      dynamic.push({
        time: stamp,
        kind: "signal",
        text: `${c.name}: not configured (set env in Railway)`,
      });
    } else {
      dynamic.push({
        time: stamp,
        kind: c.ok ? "action" : "signal",
        text: `${c.name}: ${c.ok ? "reachable" : "unreachable"}${c.ms != null ? ` · ${c.ms}ms` : ""}`,
      });
    }
  }

  const feed = [...dynamic, ...STATIC_FEED].slice(0, 8);

  return (
    <section id="operations" className="border-b border-border py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Operational feed
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Live connector checks from your deployment, plus sample stream rows. Open the
              console to act on approvals and automations.
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
                <li key={row.time + row.text + row.kind} className="flex gap-4 px-4 py-3">
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
              <p className="text-sm font-medium text-foreground">Production change</p>
              <p className="mt-1 text-xs text-muted">
                Increase DB connection limit — requires two-person rule
              </p>
              <div className="mt-4">
                <Link
                  href="/approvals"
                  className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600/90 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  Open approvals in console
                </Link>
              </div>
            </div>
            <p className="text-xs text-muted">
              Approve or deny in the app — demo mode works without Supabase; database mode after
              migration.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
