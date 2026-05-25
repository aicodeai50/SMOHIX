import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/app/PageHeader";
import { AppIcon } from "@/components/icons/AppIcon";
import { OverviewDecisionSurface } from "@/components/overview/OverviewDecisionSurface";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";
import { getPolicyBlockSummaryForUser } from "@/lib/approvals/policy-block-analytics";
import { listApprovalsForUser } from "@/lib/approvals/data";
import {
  policySuggestedReviewerNote,
  type PolicyBlockReasonCode,
} from "@/lib/approvals/policy-block-reasons";
import { listAcceptedPolicyGuardrailsByPlaybook } from "@/lib/approvals/policy-suggestions";
import { listAutomationDryRuns } from "@/lib/automations/dry-runs-db";
import { listDryRuns } from "@/lib/automations/runs-dev";
import { getConnectorHealthRows } from "@/lib/connectors-health";
import { listIncidentsForUser } from "@/lib/incidents/data";
import { getOrgContextForUser } from "@/lib/org/context";
import { loadOverviewCommandCenterData } from "@/lib/overview/command-center-data";
import { listServicesForUser } from "@/lib/services/data";
import { getErrorBudgetOverviewSummary, listLatestBurnStatesForUser } from "@/lib/services/slo";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Overview",
  description: "Command center — incidents, connectors, and setup status.",
};

export const dynamic = "force-dynamic";

function percentile(values: number[], pct: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1));
  return sorted[idx] ?? null;
}

function formatMinutesLabel(value: number | null): string {
  if (value == null || !Number.isFinite(value) || value < 0) return "—";
  if (value < 60) return `${Math.round(value)}m`;
  const h = Math.floor(value / 60);
  const m = Math.round(value % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function OverviewPage() {
  let userId: string | null = null;
  let devTenantKey: string | null = null;
  let supabaseClient: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null;

  let activeOrgId: string | null = null;

  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    supabaseClient = supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/auth/sign-in?next=/overview");
    }
    userId = user.id;
    activeOrgId = (await getOrgContextForUser(user.id)).orgId;
  } else {
    devTenantKey = (await cookies()).get("zentro_dev_tid")?.value ?? "anon";
  }

  const [{ rows: incidents }, connectors] = await Promise.all([
    listIncidentsForUser(userId ?? "", devTenantKey, activeOrgId),
    getConnectorHealthRows(),
  ]);
  const approvals = await listApprovalsForUser({
    userId: userId ?? "local",
    devTenantId: devTenantKey,
    orgId: activeOrgId,
  });
  let dryRuns = devTenantKey ? listDryRuns(devTenantKey) : [];
  if (supabaseClient && userId) {
    const dryRunRes = await listAutomationDryRuns(supabaseClient, {
      userId,
      orgId: activeOrgId,
    });
    dryRuns = dryRunRes.runs;
  }

  const command = await loadOverviewCommandCenterData({
    userId,
    devTenantKey,
    orgId: activeOrgId,
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
    robot: Boolean(process.env.ZENTRO_ROBOT_API_URL?.trim()),
    reasoning: Boolean(process.env.ZENTRO_REASONING_API_URL?.trim()),
  };

  const setupDone = Object.values(setup).filter(Boolean).length;
  const connectorsConfigured = connectors.filter((c) => c.baseUrl).length;
  const connectorsUp = connectors.filter((c) => c.ok === true).length;
  const approvalDecisions = approvals.recent.length;
  const approvalsPending = approvals.pending.length;
  const successfulDryRuns = dryRuns.filter((run) => run.ok).length;
  const dryRunSuccessRate =
    dryRuns.length > 0 ? Math.round((successfulDryRuns / dryRuns.length) * 100) : 0;
  let approvalP50Label = "—";
  let approvalP95Label = "—";
  let pendingOldestLabel = "—";
  let pendingRiskLabel =
    approvalsPending > 0
      ? "Pending approvals detected (detailed queue health requires workspace data)"
      : "No pending backlog";
  let decisionAccuracyLabel = "—";
  let proposedSuggestions = 0;
  let acceptedSuggestions = 0;
  let enforcementPlaybookCount = 0;
  let enforcementBlastCapCount = 0;
  let enforcementSummary = "Available in signed-in workspaces";
  let policyBlocksLast7d = 0;
  let policyBlockTrendLabel = "Available in signed-in workspaces";
  let policyBlockDeltaLabel = "No baseline";
  let topPolicyBlockReasonCode: PolicyBlockReasonCode = "unknown";
  let topPolicyBlockSuggestedNote = "";
  let errorBudgetServices = 0;
  let criticalBurnServices = 0;
  let warningBurnServices = 0;
  let avgBudgetUsedPercent: number | null = null;
  let topCriticalServices: Array<{ id: string; name: string }> = [];

  if (supabaseClient && userId) {
    const { data: approvalRows } = await supabaseClient
      .from("approval_requests")
      .select("status, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(300);
    const decidedMins: number[] = [];
    const pendingMins: number[] = [];
    const now = new Date().valueOf();
    for (const row of approvalRows ?? []) {
      const status = String(row.status ?? "").toLowerCase();
      const createdMs = new Date(String(row.created_at ?? "")).valueOf();
      if (!Number.isFinite(createdMs)) continue;
      if (status === "approved" || status === "denied") {
        const updatedMs = new Date(String(row.updated_at ?? "")).valueOf();
        if (!Number.isFinite(updatedMs) || updatedMs < createdMs) continue;
        decidedMins.push((updatedMs - createdMs) / 60000);
      } else if (status === "pending") {
        pendingMins.push((now - createdMs) / 60000);
      }
    }
    const p50 = percentile(decidedMins, 50);
    const p95 = percentile(decidedMins, 95);
    approvalP50Label = formatMinutesLabel(p50);
    approvalP95Label = formatMinutesLabel(p95);
    const oldestPendingMin = pendingMins.length ? Math.max(...pendingMins) : null;
    pendingOldestLabel = formatMinutesLabel(oldestPendingMin);
    const staleCount = pendingMins.filter((m) => m >= 24 * 60).length;
    pendingRiskLabel =
      pendingMins.length === 0
        ? "No pending backlog"
        : staleCount > 0
          ? `${staleCount} older than 24h`
          : "Fresh queue (no >24h pending)";

    const { data: execRows } = await supabaseClient
      .from("automation_executions")
      .select("decision_accuracy_score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    const accValues = (execRows ?? [])
      .map((r) => Number(r.decision_accuracy_score ?? NaN))
      .filter((n) => Number.isFinite(n));
    if (accValues.length) {
      const avg = Math.round(accValues.reduce((a, b) => a + b, 0) / accValues.length);
      decisionAccuracyLabel = `${avg}/100`;
    }

    const { data: suggestionRows } = await supabaseClient
      .from("policy_suggestions")
      .select("status")
      .eq("user_id", userId)
      .limit(200);
    proposedSuggestions = (suggestionRows ?? []).filter((r) => String(r.status) === "proposed").length;
    acceptedSuggestions = (suggestionRows ?? []).filter((r) => String(r.status) === "accepted").length;

    const acceptedGuardrails = await listAcceptedPolicyGuardrailsByPlaybook(supabaseClient, userId);
    const acceptedByPlaybook = Object.values(acceptedGuardrails);
    enforcementPlaybookCount = acceptedByPlaybook.length;
    enforcementBlastCapCount = acceptedByPlaybook.filter((g) => Boolean(g.maxBlastRadius)).length;
    enforcementSummary =
      enforcementPlaybookCount === 0
        ? "No enforced policies yet"
        : `${enforcementBlastCapCount} with explicit blast caps`;

    const policyBlocks = await getPolicyBlockSummaryForUser(supabaseClient, userId, "7d");
    policyBlocksLast7d = policyBlocks.count;
    topPolicyBlockReasonCode = policyBlocks.topReasonCode ?? "unknown";
    topPolicyBlockSuggestedNote = policySuggestedReviewerNote(topPolicyBlockReasonCode);
    const compactTopReason =
      policyBlocks.topReasonLabel && policyBlocks.topReasonLabel.length > 80
        ? `${policyBlocks.topReasonLabel.slice(0, 79)}…`
        : policyBlocks.topReasonLabel;
    policyBlockTrendLabel =
      policyBlocksLast7d === 0
        ? "No policy-blocked executions in last 7d"
        : compactTopReason
          ? `Top reason: ${compactTopReason}`
          : "Policy blocks recorded in last 7d";
    const delta = policyBlocks.delta;
    policyBlockDeltaLabel =
      policyBlocks.priorCount === 0
        ? "No prior-week baseline"
        : delta === 0
          ? "No change vs prior 7d"
          : delta > 0
            ? `Up ${delta} vs prior 7d`
            : `Down ${Math.abs(delta)} vs prior 7d`;

    const errorBudget = await getErrorBudgetOverviewSummary(supabaseClient, userId, activeOrgId);
    errorBudgetServices = errorBudget.servicesWithSlo;
    criticalBurnServices = errorBudget.criticalBurnServices;
    warningBurnServices = errorBudget.warningBurnServices;
    avgBudgetUsedPercent = errorBudget.averageBudgetUsedPercent;
    const [serviceRows, burnStates] = await Promise.all([
      listServicesForUser(userId, activeOrgId),
      listLatestBurnStatesForUser(supabaseClient, userId, activeOrgId),
    ]);
    topCriticalServices = serviceRows
      .filter((svc) => (burnStates.get(svc.id) ?? "healthy") === "critical")
      .map((svc) => ({ id: svc.id, name: svc.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 5);
  }

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Command center"
        description="Prioritize decisions: what requires human approval, what executed safely, and where readiness constraints are blocking delivery."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="zentro-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Incidents</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{incidents.length}</p>
          <p className={`mt-1 ${appMeta}`}>
            {open} open · {resolved} resolved
          </p>
        </div>
        <div className="zentro-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>High / critical</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{hot}</p>
          <p className={`mt-1 ${appMeta}`}>Requires active response</p>
        </div>
        <div className="zentro-glass rounded-2xl p-5">
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
              ? "No connector endpoints configured"
              : "Healthy endpoints of configured total"}
          </p>
        </div>
        <div className="zentro-glass rounded-2xl p-5">
          <p className={`${appMeta} font-medium`}>Setup checklist</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {setupDone}
            <span className={`${appPanelTitle} font-normal text-muted`}> / 4</span>
          </p>
          <p className={`mt-1 ${appMeta}`}>Operational readiness</p>
        </div>
      </div>

      <OverviewDecisionSurface command={command} recentIncidents={incidents.slice(0, 8)} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="zentro-glass rounded-2xl p-5 md:p-6">
          <h2 className={appPanelTitle}>Operational trust metrics</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
              <p className={appMeta}>Dry-run success</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{dryRunSuccessRate}%</p>
              <p className={appMeta}>
                {successfulDryRuns}/{dryRuns.length || 0} runs
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
              <p className={appMeta}>Pending approvals</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{approvalsPending}</p>
              <p className={appMeta}>{pendingRiskLabel}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
              <p className={appMeta}>Approval latency (p50)</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{approvalP50Label}</p>
              <p className={appMeta}>
                p95 {approvalP95Label} · oldest pending {pendingOldestLabel} · {approvalDecisions} decisions
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
              <p className={appMeta}>Decision intelligence</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{decisionAccuracyLabel}</p>
              <p className={appMeta}>{proposedSuggestions} proposed · {acceptedSuggestions} accepted</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
              <p className={appMeta}>Enforcement coverage</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{enforcementPlaybookCount}</p>
              <p className={appMeta}>{enforcementSummary}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
              <p className={appMeta}>Policy blocks (7d)</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{policyBlocksLast7d}</p>
              <p className={appMeta}>{policyBlockTrendLabel}</p>
              <p className={appMeta}>{policyBlockDeltaLabel}</p>
              {policyBlocksLast7d > 0 ? (
                <Link
                  href={`/governance/policies?status=proposed&seed_reason=${encodeURIComponent(topPolicyBlockReasonCode)}&seed_note=${encodeURIComponent(topPolicyBlockSuggestedNote)}`}
                  className={`mt-1 inline-block font-medium text-accent hover:underline ${appMeta}`}
                >
                  Start policy response from top reason →
                </Link>
              ) : null}
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
              <p className={appMeta}>Error budget (7d)</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {errorBudgetServices > 0 ? `${criticalBurnServices} critical` : "—"}
              </p>
              <p className={appMeta}>
                {errorBudgetServices > 0
                  ? `${warningBurnServices} warning · avg used ${avgBudgetUsedPercent ?? 0}%`
                  : "No SLO windows yet"}
              </p>
            </div>
          </div>
          <p className={`mt-4 ${appMeta}`}>
            These indicators are designed to evidence safety and execution confidence, not just activity volume.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link href="/approvals" className={`font-medium text-accent hover:underline ${appBody}`}>
              Review approvals →
            </Link>
            <Link href="/automations" className={`font-medium text-accent hover:underline ${appBody}`}>
              Review dry-runs →
            </Link>
            <Link href="/audit" className={`font-medium text-accent hover:underline ${appBody}`}>
              Review audit trail →
            </Link>
            <Link href="/governance/policies" className={`font-medium text-accent hover:underline ${appBody}`}>
              Review policy queue →
            </Link>
          </div>
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={appMeta}>Burn triage shortcuts</p>
              <div className="flex items-center gap-1">
                <Link
                  href="/services"
                  className={`rounded-full border border-white/[0.12] bg-white/[0.02] px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-muted hover:text-foreground`}
                >
                  all
                </Link>
                <Link
                  href="/services?burn=critical"
                  className={`rounded-full border border-danger/40 bg-danger/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-danger`}
                >
                  critical
                </Link>
                <Link
                  href="/services?burn=warning"
                  className={`rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-300`}
                >
                  warning
                </Link>
                <Link
                  href="/services?burn=healthy"
                  className={`rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300`}
                >
                  healthy
                </Link>
              </div>
            </div>
            <p className={`mt-2 ${appMeta}`}>
              {errorBudgetServices > 0
                ? `${criticalBurnServices} critical, ${warningBurnServices} warning out of ${errorBudgetServices} SLO-tracked services.`
                : "No burn-state telemetry available yet. Configure service SLOs to activate triage."}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Link href="/incidents" className={`font-medium text-accent hover:underline ${appMeta}`}>
                Open incidents →
              </Link>
              <Link href="/automations" className={`font-medium text-accent hover:underline ${appMeta}`}>
                Open automations →
              </Link>
              <Link href="/services?burn=critical" className={`font-medium text-accent hover:underline ${appMeta}`}>
                Open critical services →
              </Link>
            </div>
            {topCriticalServices.length > 0 ? (
              <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
                <p className={`${appMeta} text-danger`}>Top critical services</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {topCriticalServices.map((service) => (
                    <Link
                      key={`critical-svc-${service.id}`}
                      href={`/incidents/new?service_id=${encodeURIComponent(service.id)}&severity=critical&title=${encodeURIComponent(`Critical burn budget risk: ${service.name}`)}`}
                      className="rounded-full border border-danger/40 bg-danger/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-danger"
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
        <section className="zentro-glass rounded-2xl p-5 md:p-6">
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

        <section className="zentro-glass rounded-2xl p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={appPanelTitle}>Deployment checklist</h2>
            <Link
              href="/settings#setup-wizard"
              className={`rounded-lg border border-accent/45 bg-accent/10 px-3 py-1.5 font-medium text-accent transition-colors hover:border-accent/70 hover:bg-accent/20 ${appBody}`}
            >
              Open setup wizard
            </Link>
          </div>
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
