import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { AppIcon } from "@/components/icons/AppIcon";
import { OverviewDecisionSurface } from "@/components/overview/OverviewDecisionSurface";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { getConnectorHealthRows } from "@/lib/connectors-health";
import { listIncidentsForUser } from "@/lib/incidents/data";
import { loadOverviewCommandCenterData } from "@/lib/overview/command-center-data";
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

  const command = await loadOverviewCommandCenterData({
    userId,
    devTenantKey,
    incidents,
    connectors,
  });

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
        description="Decisions first: what needs a human, what executed safely, and where connectors or billing block work. Deeper health and setup live below."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="shynvo-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Incidents tracked</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{incidents.length}</p>
          <p className={`mt-1 ${appMeta}`}>
            {open} open · {resolved} resolved
          </p>
        </div>
        <div className="shynvo-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>High / critical</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{hot}</p>
          <p className={`mt-1 ${appMeta}`}>Needs attention</p>
        </div>
        <div className="shynvo-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Connectors</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {connectorsUp}
            <span className={`${appPanelTitle} font-normal text-muted`}>
              {" "}
              / {connectorsConfigured}
            </span>
          </p>
          <p className={`mt-1 ${appMeta}`}>
            {connectorsConfigured === 0
              ? "No connector URLs configured"
              : "Reachable of configured"}
          </p>
        </div>
        <div className="shynvo-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Setup checklist</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {setupDone}
            <span className={`${appPanelTitle} font-normal text-muted`}> / 4</span>
          </p>
          <p className={`mt-1 ${appMeta}`}>Workspace readiness</p>
        </div>
      </div>

      <OverviewDecisionSurface command={command} recentIncidents={incidents.slice(0, 8)} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="shynvo-glass rounded-2xl p-5 md:p-6">
          <h2 className={appPanelTitle}>Integrations</h2>
          <ul className={`mt-4 space-y-3 ${appBody} text-foreground/90`}>
            {connectors.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-2 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-foreground/90">{c.name}</p>
                  <p className={appMeta}>{c.role}</p>
                </div>
                <span
                  className={`shrink-0 text-[13px] font-medium ${
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
            className={`mt-4 inline-block font-medium text-accent hover:underline ${appMeta}`}
          >
            Connector settings →
          </Link>
        </section>

        <section className="shynvo-glass rounded-2xl p-5 md:p-6">
          <h2 className={appPanelTitle}>Deployment checklist</h2>
          <ul className={`mt-4 space-y-2 ${appBody} text-foreground/90`}>
            {[
              { ok: setup.accounts, label: "Accounts & database", href: "/settings" },
              { ok: setup.openai, label: "Copilot cloud model", href: "/copilot" },
              { ok: setup.reasoning, label: "Extended reasoning", href: "/settings/connectors" },
              { ok: setup.robot, label: "Automation connector", href: "/settings/connectors" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg py-1.5 transition-colors hover:bg-white/[0.04]"
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      item.ok ? "bg-success-dim text-success" : "bg-border text-muted"
                    }`}
                  >
                    {item.ok ? (
                      <AppIcon name="check" size={12} strokeWidth={2.75} className="text-success" />
                    ) : (
                      <AppIcon name="circle" size={10} strokeWidth={1.5} className="opacity-50" />
                    )}
                  </span>
                  <span className={item.ok ? "text-foreground/85" : "text-muted"}>
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={`mt-4 ${appMeta}`}>
            Paid plans sync through billing webhooks after you configure keys; until then billing
            views stay inactive while the rest of the console runs on session or database data.
          </p>
        </section>
      </div>
    </>
  );
}
