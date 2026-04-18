import Link from "next/link";

import { getConnectorHealthRows } from "@/lib/connectors-health";
import { hasSupabaseAuth } from "@/lib/supabase/env";

type FeedRow = { time: string; kind: string; text: string };

/** Operational snapshot for optional integrations (no hosting vendor names in user copy). */
export async function LivePanel() {
  const connectors = await getConnectorHealthRows();
  const authEnabled = hasSupabaseAuth();
  const now = new Date();
  const stamp = now.toISOString().slice(11, 19);

  const dynamic: FeedRow[] = [];
  for (const c of connectors) {
    if (c.ok === null) {
      dynamic.push({
        time: stamp,
        kind: "signal",
        text: `${c.name}: not connected`,
      });
    } else {
      dynamic.push({
        time: stamp,
        kind: c.ok ? "action" : "signal",
        text: `${c.name}: ${c.ok ? "reachable" : "unreachable"}${c.ms != null ? ` · ${c.ms}ms` : ""}`,
      });
    }
  }

  const feed = dynamic.slice(0, 8);
  const anyDown = connectors.some((c) => c.ok === false);
  const anyUnknown = connectors.some((c) => c.ok === null);

  return (
    <section id="operations" className="border-b border-white/[0.06] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Service status
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Optional integrations your administrator can enable. When nothing is connected,
              the console still runs with built-in defaults.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
              anyDown
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                : anyUnknown
                  ? "border-white/[0.12] bg-white/[0.04] text-muted"
                  : "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {!anyDown && !anyUnknown ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </>
              ) : (
                <span className="relative inline-flex h-2 w-2 rounded-full bg-current opacity-80" />
              )}
            </span>
            {anyDown ? "Check status" : anyUnknown ? "Optional setup" : "All services reachable"}
          </span>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          <div className="flex flex-col rounded-lg border border-white/[0.08] bg-white/[0.02] text-sm lg:col-span-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 text-xs text-muted">
              <span>Integration</span>
              <span>UTC</span>
            </div>
            <ul className="min-h-[12rem] divide-y divide-white/[0.06] font-mono text-[13px]">
              {feed.map((row, i) => (
                <li key={`${i}-${row.text}`} className="flex gap-4 px-4 py-3">
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
                    {row.kind === "action" ? "●" : "○"}
                  </span>
                  <span className="text-foreground/90">{row.text}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.06] px-4 py-3 text-xs">
              <Link href="/settings/connectors" className="font-medium text-accent hover:underline">
                Connectors
              </Link>
              <Link href="/hub" className="text-muted transition-colors hover:text-accent">
                Console hub
              </Link>
            </div>
          </div>

          <aside className="space-y-4 rounded-lg border border-white/[0.08] bg-white/[0.02] p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground">Approvals</h3>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm font-medium text-foreground">Review queue</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                High-impact changes can require reviewer approval before execution.
              </p>
              <div className="mt-4">
                <Link
                  href="/approvals"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600/90 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  Approvals
                </Link>
              </div>
            </div>
            {!authEnabled ? (
              <p className="text-xs leading-relaxed text-muted">
                Organization-wide queues require administrator sign-in to be enabled.{" "}
                <Link href="/settings" className="text-accent hover:underline">
                  Settings
                </Link>
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
