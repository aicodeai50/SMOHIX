import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { getConnectorHealthRows } from "@/lib/connectors-health";
import { CONSOLE_MODULES } from "@/lib/console-nav";
import { listIncidentsForUser } from "@/lib/incidents/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Overview",
  description: "Command center — incidents, connectors, and setup status.",
};

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  let userId: string | null = null;
  let devTenantKey: string | null = null;

  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/overview");
    }
    userId = user.id;
  } else {
    devTenantKey = (await cookies()).get("shynvo_dev_tid")?.value ?? "anon";
  }

  const [{ rows: incidents }, connectors] = await Promise.all([
    listIncidentsForUser(userId ?? "", devTenantKey),
    getConnectorHealthRows(),
  ]);

  const open = incidents.filter((r) => r.status !== "resolved").length;
  const resolved = incidents.filter((r) => r.status === "resolved").length;
  const hot = incidents.filter(
    (r) => r.severity === "critical" || r.severity === "high",
  ).length;

  const setup = {
    accounts: hasSupabaseAuth(),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    robot: Boolean(process.env.SHYNVO_ROBOT_API_URL?.trim()),
    reasoning: Boolean(process.env.SHYNVO_REASONING_API_URL?.trim()),
  };

  const setupDone = Object.values(setup).filter(Boolean).length;
  const connectorsConfigured = connectors.filter((c) => c.baseUrl).length;
  const connectorsUp = connectors.filter((c) => c.ok === true).length;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Command center"
        description="Snapshot of incidents, integration health, and what is configured in this deployment. Connect Supabase and Lemon Squeezy when you are ready for accounts and billing."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="shynvo-glass rounded-2xl p-5">
          <p className="text-xs font-medium text-muted">Incidents tracked</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{incidents.length}</p>
          <p className="mt-1 text-xs text-muted">{open} open · {resolved} resolved</p>
        </div>
        <div className="shynvo-glass rounded-2xl p-5">
          <p className="text-xs font-medium text-muted">High / critical</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{hot}</p>
          <p className="mt-1 text-xs text-muted">Needs attention</p>
        </div>
        <div className="shynvo-glass rounded-2xl p-5">
          <p className="text-xs font-medium text-muted">Connectors</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {connectorsUp}
            <span className="text-lg font-normal text-muted">
              {" "}
              / {connectorsConfigured}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">
            {connectorsConfigured === 0
              ? "No integration URLs in env"
              : "Reachable of configured"}
          </p>
        </div>
        <div className="shynvo-glass rounded-2xl p-5">
          <p className="text-xs font-medium text-muted">Setup checklist</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {setupDone}
            <span className="text-lg font-normal text-muted"> / 4</span>
          </p>
          <p className="mt-1 text-xs text-muted">Env capabilities</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="shynvo-glass rounded-2xl p-5 md:p-6">
          <h2 className="text-sm font-semibold text-foreground/95">Integrations</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {connectors.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-foreground/90">{c.name}</p>
                  <p className="text-xs text-muted">{c.role}</p>
                </div>
                <span
                  className={`shrink-0 text-xs font-medium ${
                    c.ok === true
                      ? "text-success"
                      : c.ok === false
                        ? "text-danger"
                        : "text-muted"
                  }`}
                >
                  {c.ok === true
                    ? c.ms != null
                      ? `OK · ${c.ms}ms`
                      : "OK"
                    : c.ok === false
                      ? "Unreachable"
                      : "Not configured"}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/settings/connectors"
            className="mt-4 inline-block text-xs font-medium text-accent hover:underline"
          >
            Connector settings →
          </Link>
        </section>

        <section className="shynvo-glass rounded-2xl p-5 md:p-6">
          <h2 className="text-sm font-semibold text-foreground/95">Deployment checklist</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { ok: setup.accounts, label: "Supabase auth & database", href: "/settings" },
              { ok: setup.openai, label: "OpenAI (Copilot GPT)", href: "/copilot" },
              { ok: setup.reasoning, label: "Reasoning service URL", href: "/settings/connectors" },
              { ok: setup.robot, label: "Automation / robot URL", href: "/settings/connectors" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg py-1.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      item.ok ? "bg-success-dim text-success" : "bg-border text-muted"
                    }`}
                  >
                    {item.ok ? "✓" : ""}
                  </span>
                  <span className={item.ok ? "text-foreground/85" : "text-muted"}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Billing uses Lemon Squeezy webhooks after you add keys; until then billing views stay
            inactive while the rest of the console runs on session or database data.
          </p>
        </section>
      </div>

      <section className="shynvo-glass mt-8 rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground/95">Jump to module</h2>
          <Link href="/incidents" className="text-xs font-medium text-accent hover:underline">
            All incidents →
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CONSOLE_MODULES.filter((m) => m.href !== "/overview").map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3 text-sm transition-[border-color,background-color,box-shadow] hover:border-accent/35 hover:bg-white/[0.05] hover:shadow-[0_0_24px_-12px_rgba(94,225,255,0.12)]"
            >
              <span className="text-foreground/90">{m.label}</span>
              <span className="mt-0.5 block text-xs text-muted">{m.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
