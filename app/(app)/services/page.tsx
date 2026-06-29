import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AlertIngestPanel } from "@/components/settings/AlertIngestPanel";
import { ConsoleEmptyState } from "@/components/app/ConsoleEmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { ConsoleAmbientBanner } from "@/components/console/ConsoleAmbientBanner";
import { ConsolePanel } from "@/components/app/ConsolePanel";
import { appBody, appLabel, appMeta, appOverline, appPanelTitle } from "@/lib/app-typography";
import { billingPlanFromSummary, getSubscriptionSummary } from "@/lib/billing/plan";
import { loadConsoleAmbientSnapshot } from "@/lib/console/load-ambient-status";
import { listServiceDependencyGraphForUser } from "@/lib/services/dependencies";
import { getOrgContextForUser } from "@/lib/org/context";
import { listServicesForUser } from "@/lib/services/data";
import {
  getErrorBudgetOverviewSummary,
  listLatestBurnStatesForUser,
  listServiceSloConfigsForUser,
} from "@/lib/services/slo";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  createServiceAction,
  createServiceDependencyAction,
  deleteServiceAction,
  deleteServiceDependencyAction,
  updateServiceSloAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Services",
  description: "Service catalog and alert ingest for incidents.",
};

export const dynamic = "force-dynamic";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; burn?: string }>;
}) {
  if (!hasSupabaseAuth()) {
    return (
      <>
        <PageHeader
          title="Services"
          description="Connect Supabase and sign in to manage a service catalog and paid alert ingest."
        />
        <p className={`max-w-xl text-muted ${appBody}`}>
          Local mode does not persist services. Configure auth to use this module.
        </p>
      </>
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/services");
  }

  const { summary, error: subscriptionError } = await getSubscriptionSummary(supabase, user.id);
  const subscriptionGatedFree =
    !subscriptionError && billingPlanFromSummary(summary) === "free";

  const sp = await searchParams;
  const err = typeof sp.error === "string" ? sp.error : undefined;
  const burnFilter =
    sp.burn === "critical" || sp.burn === "warning" || sp.burn === "healthy" ? sp.burn : "all";

  const orgContext = await getOrgContextForUser(user.id);

  const [rows, dependencyGraph, sloSummary, sloConfigs, latestBurnStates, ambient] = await Promise.all([
    listServicesForUser(user.id, orgContext.orgId),
    listServiceDependencyGraphForUser(supabase, user.id, orgContext.orgId),
    getErrorBudgetOverviewSummary(supabase, user.id, orgContext.orgId),
    listServiceSloConfigsForUser(supabase, user.id, orgContext.orgId),
    listLatestBurnStatesForUser(supabase, user.id, orgContext.orgId),
    loadConsoleAmbientSnapshot({ context: "services" }),
  ]);
  const sloByServiceId = new Map(sloConfigs.map((cfg) => [cfg.serviceId, cfg]));
  const burnRank = new Map([
    ["critical", 0],
    ["warning", 1],
    ["healthy", 2],
  ] as const);
  const visibleRows = rows
    .filter((row) => (burnFilter === "all" ? true : (latestBurnStates.get(row.id) ?? "healthy") === burnFilter))
    .sort((a, b) => {
      const aState = latestBurnStates.get(a.id) ?? "healthy";
      const bState = latestBurnStates.get(b.id) ?? "healthy";
      const rankDiff = (burnRank.get(aState) ?? 9) - (burnRank.get(bState) ?? 9);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name);
    });
  const serviceRoleConfigured = Boolean(createServiceSupabaseClient());

  if (subscriptionGatedFree) {
    return (
      <>
        <PageHeader
          title="Services"
          description="Map systems and owners, then open incidents from monitoring via a secure webhook — included with an active subscription."
        />
        {err ? (
          <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
            {err}
          </p>
        ) : null}
        <div className="zentro-glass rounded-2xl p-6 md:p-8">
          <h2 className={appPanelTitle}>Subscription required</h2>
          <p className={`mt-2 max-w-md text-muted ${appBody}`}>
            Service catalog and alert ingest are paid capabilities: they tie your observability
            stack to incident records and use server-side token verification.
          </p>
          <Link
            href="/settings/billing?upgrade=services"
            className={`mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 font-semibold text-background transition-opacity hover:opacity-90 ${appBody}`}
          >
            View billing & checkout
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Services"
        description="Catalog systems you operate, attach them to incidents, and accept monitoring webhooks. SLO burn and dependency edges are shared when an organization is active."
      />
      <ConsoleAmbientBanner snapshot={ambient} />
      {err ? (
        <p className={`mb-4 rounded-xl border border-danger/25 bg-danger-dim/50 px-4 py-3 text-danger ${appBody}`}>
          {err}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <ConsolePanel title="Catalog">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
              <p className={appMeta}>SLO-covered services</p>
              <p className="text-lg font-semibold text-foreground">{sloSummary.servicesWithSlo}</p>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
              <p className={appMeta}>Critical burn</p>
              <p className="text-lg font-semibold text-foreground">{sloSummary.criticalBurnServices}</p>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
              <p className={appMeta}>Avg budget used</p>
              <p className="text-lg font-semibold text-foreground">
                {sloSummary.averageBudgetUsedPercent == null
                  ? "—"
                  : `${sloSummary.averageBudgetUsedPercent}%`}
              </p>
            </div>
          </div>
          <form action={createServiceAction} className="space-y-3">
            <div>
              <label htmlFor="svc-name" className={`mb-1 block ${appLabel}`}>
                Name
              </label>
              <input
                id="svc-name"
                name="name"
                required
                maxLength={200}
                placeholder="payments-api"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="svc-env" className={`mb-1 block ${appLabel}`}>
                Environment
              </label>
              <input
                id="svc-env"
                name="environment"
                maxLength={80}
                placeholder="production"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="svc-owner" className={`mb-1 block ${appLabel}`}>
                Owner hint
              </label>
              <input
                id="svc-owner"
                name="owner_hint"
                maxLength={200}
                placeholder="Team: Platform / @pagerduty-schedule"
                className={`h-10 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <div>
              <label htmlFor="svc-desc" className={`mb-1 block ${appLabel}`}>
                Description
              </label>
              <textarea
                id="svc-desc"
                name="description"
                rows={3}
                maxLength={2000}
                placeholder="What this system does, dependencies, criticality…"
                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              />
            </div>
            <button
              type="submit"
              className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
            >
              Add service
            </button>
          </form>

          <div className="mt-6 border-t border-white/[0.06] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className={appOverline}>Registered</h3>
              <div className="flex items-center gap-1">
                {(["all", "critical", "warning", "healthy"] as const).map((filter) => (
                  <Link
                    key={filter}
                    href={filter === "all" ? "/services" : `/services?burn=${filter}`}
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${
                      burnFilter === filter
                        ? "border-accent/45 bg-accent/15 text-accent"
                        : "border-white/[0.12] bg-white/[0.02] text-muted hover:text-foreground"
                    }`}
                  >
                    {filter}
                  </Link>
                ))}
              </div>
            </div>
            {burnFilter === "critical" ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
                <p className={`text-danger ${appMeta}`}>
                  Critical-burn triage mode: prioritize containment and guardrailed response.
                </p>
                <Link
                  href="/incidents"
                  className={`rounded-md border border-danger/35 bg-danger/15 px-2 py-1 text-danger hover:bg-danger/20 ${appMeta}`}
                >
                  Open incidents
                </Link>
                <Link
                  href="/automations"
                  className={`rounded-md border border-accent/35 bg-accent/10 px-2 py-1 text-accent hover:bg-accent/15 ${appMeta}`}
                >
                  Open automations
                </Link>
                <Link
                  href="/governance/policies"
                  className={`rounded-md border border-white/[0.14] bg-white/[0.03] px-2 py-1 text-foreground/85 hover:border-accent/30 ${appMeta}`}
                >
                  Review guardrails
                </Link>
              </div>
            ) : null}
            {burnFilter === "warning" ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                <p className={`text-amber-200/90 ${appMeta}`}>
                  Warning-burn watch mode: prep mitigations before services enter critical burn.
                </p>
                <Link
                  href="/incidents"
                  className={`rounded-md border border-amber-400/35 bg-amber-500/15 px-2 py-1 text-amber-200 hover:bg-amber-500/20 ${appMeta}`}
                >
                  Open incidents
                </Link>
                <Link
                  href="/runbooks"
                  className={`rounded-md border border-white/[0.14] bg-white/[0.03] px-2 py-1 text-foreground/85 hover:border-accent/30 ${appMeta}`}
                >
                  Open runbooks
                </Link>
              </div>
            ) : null}
            {rows.length === 0 ? (
              <div className="mt-4">
                <ConsoleEmptyState
                  title="No services in the catalog"
                  description="Add a system you operate so incidents can link to it and ingest can resolve service_name."
                  ctas={[{ href: "#svc-name", label: "Fill form above" }]}
                />
              </div>
            ) : visibleRows.length === 0 ? (
              <p className={`mt-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 ${appMeta}`}>
                No services match the <span className="font-medium text-foreground">{burnFilter}</span> burn filter.
              </p>
            ) : (
              <ul className={`mt-3 space-y-2 ${appBody}`}>
                {visibleRows.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground/90">{r.name}</p>
                          {(() => {
                            const state = latestBurnStates.get(r.id) ?? "healthy";
                            const tone =
                              state === "critical"
                                ? "border-danger/40 bg-danger/10 text-danger"
                                : state === "warning"
                                  ? "border-amber-400/40 bg-amber-500/10 text-amber-300"
                                  : "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
                            return (
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${tone}`}>
                                {state} burn (7d)
                              </span>
                            );
                          })()}
                        </div>
                        {r.environment ? (
                          <p className={appMeta}>{r.environment}</p>
                        ) : null}
                        {r.ownerHint ? (
                          <p className={appMeta}>{r.ownerHint}</p>
                        ) : null}
                        <p className={`mt-1 font-mono text-accent/80 ${appMeta}`}>{r.id}</p>
                      </div>
                      <form action={deleteServiceAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className={`font-medium text-danger hover:underline ${appMeta}`}
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                    <form
                      action={updateServiceSloAction}
                      className="mt-3 grid gap-2 border-t border-white/[0.06] pt-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
                    >
                      <input type="hidden" name="service_id" value={r.id} />
                      <input
                        type="number"
                        name="target_percent"
                        step="0.01"
                        min="90"
                        max="99.99"
                        defaultValue={sloByServiceId.get(r.id)?.targetPercent ?? 99.9}
                        className={`h-9 rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appMeta}`}
                        aria-label={`${r.name} SLO target percent`}
                      />
                      <select
                        name="window_days"
                        defaultValue={String(sloByServiceId.get(r.id)?.windowDays ?? 30)}
                        className={`h-9 rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appMeta}`}
                        aria-label={`${r.name} SLO window`}
                      >
                        <option value="7">7d</option>
                        <option value="30">30d</option>
                        <option value="90">90d</option>
                      </select>
                      <label className={`inline-flex h-9 items-center gap-2 px-1 ${appMeta}`}>
                        <input
                          type="checkbox"
                          name="enabled"
                          defaultChecked={sloByServiceId.get(r.id)?.enabled ?? true}
                          className="h-4 w-4 rounded border-border bg-background"
                        />
                        Enabled
                      </label>
                      <button
                        type="submit"
                        className={`h-9 rounded-lg border border-accent/35 bg-accent/10 px-3 font-medium text-accent hover:bg-accent/15 ${appMeta}`}
                      >
                        Save SLO
                      </button>
                      <p className={`sm:col-span-4 ${appMeta}`}>
                        SLO config (availability): target %, evaluation window, and enforcement readiness.
                      </p>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-6 border-t border-white/[0.06] pt-5">
            <h3 className={appOverline}>Dependency graph</h3>
            <p className={`mt-2 ${appMeta}`}>
              {dependencyGraph.edges.length} edges across {dependencyGraph.nodes.length} services.{" "}
              <Link href="/assets/attack-paths" className="text-accent hover:underline">
                Simulate attack paths
              </Link>
            </p>
            <form action={createServiceDependencyAction} className="mt-3 grid gap-2 sm:grid-cols-2">
              <select
                name="service_id"
                required
                className={`h-10 rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              >
                <option value="">Service</option>
                {dependencyGraph.nodes.map((node) => (
                  <option key={`dep-from-${node.id}`} value={node.id}>
                    {node.name}
                  </option>
                ))}
              </select>
              <select
                name="depends_on_service_id"
                required
                className={`h-10 rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              >
                <option value="">Depends on</option>
                {dependencyGraph.nodes.map((node) => (
                  <option key={`dep-to-${node.id}`} value={node.id}>
                    {node.name}
                  </option>
                ))}
              </select>
              <select
                name="relationship"
                className={`h-10 rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
              >
                <option value="runtime">Runtime</option>
                <option value="data">Data</option>
                <option value="network">Network</option>
                <option value="auth">Auth</option>
                <option value="other">Other</option>
              </select>
              <div className="flex items-center gap-2">
                <select
                  name="criticality"
                  className={`h-10 flex-1 rounded-lg border border-border bg-background px-3 text-foreground outline-none ring-ring/40 focus:ring-2 ${appBody}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button
                  type="submit"
                  className={`h-10 rounded-lg bg-accent px-4 font-medium text-background hover:opacity-90 ${appBody}`}
                >
                  Add edge
                </button>
              </div>
            </form>
            {dependencyGraph.edges.length > 0 ? (
              <ul className={`mt-2 space-y-1 ${appMeta}`}>
                {dependencyGraph.edges.slice(0, 8).map((edge, idx) => (
                  <li
                    key={`${edge.fromServiceId}-${edge.toServiceId}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5"
                  >
                    <span>
                      {edge.fromServiceName} → {edge.toServiceName} ({edge.relationship}, {edge.criticality})
                    </span>
                    <form action={deleteServiceDependencyAction}>
                      <input type="hidden" name="service_id" value={edge.fromServiceId} />
                      <input type="hidden" name="depends_on_service_id" value={edge.toServiceId} />
                      <button type="submit" className="text-danger hover:underline">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`mt-2 ${appMeta}`}>No dependencies recorded yet.</p>
            )}
          </div>
        </ConsolePanel>

        <ConsolePanel title="Monitoring ingest">
          <AlertIngestPanel serviceRoleConfigured={serviceRoleConfigured} />
        </ConsolePanel>
      </div>
    </>
  );
}
