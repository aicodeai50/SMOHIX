import { cookies } from "next/headers";

import { listApprovalsForUser } from "@/lib/approvals/data";
import { listAutomationDryRuns } from "@/lib/automations/dry-runs-db";
import { listDryRuns } from "@/lib/automations/runs-dev";
import {
  buildConsoleAmbientSnapshot,
  type ConsoleAmbientContext,
  type ConsoleAmbientSnapshot,
  approvalAmbientMetrics,
} from "@/lib/console/ambient-status";
import { getConnectorHealthRows } from "@/lib/connectors-health";
import { listIncidentsForUser } from "@/lib/incidents/data";
import { getOrgContextForUser } from "@/lib/org/context";
import { listServicesForUser } from "@/lib/services/data";
import { getErrorBudgetOverviewSummary } from "@/lib/services/slo";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function loadConsoleAmbientSnapshot(options?: {
  context?: ConsoleAmbientContext;
}): Promise<ConsoleAmbientSnapshot> {
  const context = options?.context ?? "default";
  if (!hasSupabaseAuth()) {
    const devTenantKey = (await cookies()).get("zentro_dev_tid")?.value ?? "anon";
    const [{ rows: incidents }, approvals] = await Promise.all([
      listIncidentsForUser("", devTenantKey, null),
      listApprovalsForUser({
        userId: "local",
        devTenantId: devTenantKey,
        orgId: null,
      }),
    ]);
    const open = incidents.filter((r) => r.status !== "resolved").length;
    const hot = incidents.filter((r) => r.severity === "critical" || r.severity === "high").length;
    const dryRuns = listDryRuns(devTenantKey);
    const successful = dryRuns.filter((r) => r.ok).length;
    const dryRunSuccessRate =
      dryRuns.length > 0 ? Math.round((successful / dryRuns.length) * 100) : 0;
    const approvalMetrics = approvalAmbientMetrics(approvals.pending);

    return buildConsoleAmbientSnapshot({
      openIncidents: open,
      hotIncidents: hot,
      totalIncidents: incidents.length,
      pendingApprovals: approvalMetrics.pendingApprovals,
      pendingHighRisk: approvalMetrics.pendingHighRisk,
      pendingPolicyGaps: approvalMetrics.pendingPolicyGaps,
      connectorsUp: 0,
      connectorsConfigured: 0,
      dryRunSuccessRate,
      dryRunCount: dryRuns.length,
      criticalBurnServices: 0,
      signedIn: false,
      context,
    });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildConsoleAmbientSnapshot({
      openIncidents: 0,
      hotIncidents: 0,
      totalIncidents: 0,
      pendingApprovals: 0,
      connectorsUp: 0,
      connectorsConfigured: 0,
      dryRunSuccessRate: 0,
      dryRunCount: 0,
      criticalBurnServices: 0,
      signedIn: false,
      context,
    });
  }

  const orgContext = await getOrgContextForUser(user.id);
  const orgId = orgContext.orgId;
  const [{ rows: incidents }, connectors, approvals] = await Promise.all([
    listIncidentsForUser(user.id, null, orgId),
    getConnectorHealthRows(),
    listApprovalsForUser({
      userId: user.id,
      devTenantId: null,
      orgId,
      orgRole: orgContext.role,
    }),
  ]);

  let dryRuns = await listAutomationDryRuns(supabase, { userId: user.id, orgId });
  const successful = dryRuns.runs.filter((r) => r.ok).length;
  const dryRunSuccessRate =
    dryRuns.runs.length > 0 ? Math.round((successful / dryRuns.runs.length) * 100) : 0;

  let criticalBurnServices = 0;
  let warningBurnServices = 0;
  let servicesWithSlo = 0;
  let totalServices = 0;
  if (orgId) {
    const errorBudget = await getErrorBudgetOverviewSummary(supabase, user.id, orgId);
    criticalBurnServices = errorBudget.criticalBurnServices;
    warningBurnServices = errorBudget.warningBurnServices;
    servicesWithSlo = errorBudget.servicesWithSlo;
  }
  if (context === "services") {
    totalServices = (await listServicesForUser(user.id, orgId)).length;
  }

  const open = incidents.filter((r) => r.status !== "resolved").length;
  const hot = incidents.filter((r) => r.severity === "critical" || r.severity === "high").length;
  const connectorsConfigured = connectors.filter((c) => c.baseUrl).length;
  const connectorsUp = connectors.filter((c) => c.ok === true).length;
  const approvalMetrics = approvalAmbientMetrics(approvals.pending);

  return buildConsoleAmbientSnapshot({
    openIncidents: open,
    hotIncidents: hot,
    totalIncidents: incidents.length,
    pendingApprovals: approvalMetrics.pendingApprovals,
    pendingHighRisk: approvalMetrics.pendingHighRisk,
    pendingPolicyGaps: approvalMetrics.pendingPolicyGaps,
    connectorsUp,
    connectorsConfigured,
    dryRunSuccessRate,
    dryRunCount: dryRuns.runs.length,
    criticalBurnServices,
    warningBurnServices,
    totalServices,
    servicesWithSlo,
    signedIn: true,
    context,
  });
}
