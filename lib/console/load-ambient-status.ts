import { cookies } from "next/headers";

import { listApprovalsForUser } from "@/lib/approvals/data";
import { listAutomationDryRuns } from "@/lib/automations/dry-runs-db";
import { listDryRuns } from "@/lib/automations/runs-dev";
import {
  buildConsoleAmbientSnapshot,
  type ConsoleAmbientSnapshot,
} from "@/lib/console/ambient-status";
import { getConnectorHealthRows } from "@/lib/connectors-health";
import { listIncidentsForUser } from "@/lib/incidents/data";
import { getOrgContextForUser } from "@/lib/org/context";
import { getErrorBudgetOverviewSummary } from "@/lib/services/slo";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function loadConsoleAmbientSnapshot(): Promise<ConsoleAmbientSnapshot> {
  if (!hasSupabaseAuth()) {
    const devTenantKey = (await cookies()).get("zentro_dev_tid")?.value ?? "anon";
    const { rows: incidents } = await listIncidentsForUser("", devTenantKey, null);
    const open = incidents.filter((r) => r.status !== "resolved").length;
    const hot = incidents.filter((r) => r.severity === "critical" || r.severity === "high").length;
    const dryRuns = listDryRuns(devTenantKey);
    const successful = dryRuns.filter((r) => r.ok).length;
    const dryRunSuccessRate =
      dryRuns.length > 0 ? Math.round((successful / dryRuns.length) * 100) : 0;

    return buildConsoleAmbientSnapshot({
      openIncidents: open,
      hotIncidents: hot,
      totalIncidents: incidents.length,
      pendingApprovals: 0,
      connectorsUp: 0,
      connectorsConfigured: 0,
      dryRunSuccessRate,
      dryRunCount: dryRuns.length,
      criticalBurnServices: 0,
      signedIn: false,
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
    });
  }

  const orgId = (await getOrgContextForUser(user.id)).orgId;
  const [{ rows: incidents }, connectors, approvals] = await Promise.all([
    listIncidentsForUser(user.id, null, orgId),
    getConnectorHealthRows(),
    listApprovalsForUser({ userId: user.id, devTenantId: null, orgId }),
  ]);

  let dryRuns = await listAutomationDryRuns(supabase, { userId: user.id, orgId });
  const successful = dryRuns.runs.filter((r) => r.ok).length;
  const dryRunSuccessRate =
    dryRuns.runs.length > 0 ? Math.round((successful / dryRuns.runs.length) * 100) : 0;

  let criticalBurnServices = 0;
  if (orgId) {
    const errorBudget = await getErrorBudgetOverviewSummary(supabase, user.id, orgId);
    criticalBurnServices = errorBudget.criticalBurnServices;
  }

  const open = incidents.filter((r) => r.status !== "resolved").length;
  const hot = incidents.filter((r) => r.severity === "critical" || r.severity === "high").length;
  const connectorsConfigured = connectors.filter((c) => c.baseUrl).length;
  const connectorsUp = connectors.filter((c) => c.ok === true).length;

  return buildConsoleAmbientSnapshot({
    openIncidents: open,
    hotIncidents: hot,
    totalIncidents: incidents.length,
    pendingApprovals: approvals.pending.length,
    connectorsUp,
    connectorsConfigured,
    dryRunSuccessRate,
    dryRunCount: dryRuns.runs.length,
    criticalBurnServices,
    signedIn: true,
  });
}
