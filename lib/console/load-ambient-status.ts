import { cookies } from "next/headers";

import { listApprovalsForUser } from "@/lib/approvals/data";
import { listAuditEntriesForUser } from "@/lib/audit/data";
import { auditSinceIsoFromWindow } from "@/lib/audit/export-window";
import { canExportOrgAuditLog } from "@/lib/audit/role-filter";
import { listAutomationDryRuns } from "@/lib/automations/dry-runs-db";
import { listDryRuns } from "@/lib/automations/runs-dev";
import {
  auditAmbientMetrics,
  buildConsoleAmbientSnapshot,
  type ConsoleAmbientContext,
  type ConsoleAmbientSnapshot,
  approvalAmbientMetrics,
  copilotAmbientMetrics,
  runbookAmbientMetrics,
  settingsAmbientMetrics,
} from "@/lib/console/ambient-status";
import { getConnectorHealthRows, type ConnectorRow } from "@/lib/connectors-health";
import { listIncidentsForUser } from "@/lib/incidents/data";
import { getOrgContextForUser } from "@/lib/org/context";
import { listRunbooks } from "@/lib/runbooks/catalog";
import { listServicesForUser } from "@/lib/services/data";
import { getErrorBudgetOverviewSummary } from "@/lib/services/slo";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function copilotAmbientFieldsFromConnectors(
  connectors: ConnectorRow[],
  signedIn: boolean,
  copilotThreadCount: number,
) {
  const reasoningRow = connectors.find((row) => row.id === "reasoning");
  const reasoningConfigured = Boolean(reasoningRow?.baseUrl);
  const reasoningUp = reasoningRow?.ok ?? null;
  const metrics = copilotAmbientMetrics({
    openaiEnabled: Boolean(process.env.OPENAI_API_KEY?.trim()),
    reasoningConfigured,
    reasoningUp,
    signedIn,
    copilotThreadCount,
  });
  return {
    copilotAssistantMode: metrics.assistantMode,
    copilotThreadCount: metrics.copilotThreadCount,
    reasoningConfigured,
    reasoningUp,
  };
}

async function countCopilotThreadsForUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("copilot_threads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) {
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function loadSettingsAmbientFields(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  connectorsConfigured: number,
  connectorsUp: number,
) {
  const meta = user.user_metadata;
  const profileComplete = Boolean(
    (typeof meta?.full_name === "string" && meta.full_name.trim()) || user.email,
  );
  const [{ count: apiKeysCount }, { count: ingestCount }] = await Promise.all([
    supabase
      .from("api_keys")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("revoked_at", null),
    supabase
      .from("alert_ingest_tokens")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("revoked_at", null),
  ]);
  const hasApiKey = (apiKeysCount ?? 0) > 0;
  const hasIngestToken = (ingestCount ?? 0) > 0;
  const setupSteps = [profileComplete, hasApiKey, hasIngestToken, connectorsConfigured > 0];
  const setupStepsComplete = setupSteps.filter(Boolean).length;
  return settingsAmbientMetrics({
    setupStepsComplete,
    setupStepsTotal: 4,
    hasApiKey,
    hasIngestToken,
    profileComplete,
    connectorsConfigured,
    connectorsUp,
    openaiEnabled: Boolean(process.env.OPENAI_API_KEY?.trim()),
    signedIn: true,
  });
}

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
    const openIncidents = incidents.filter((r) => r.status !== "resolved");
    const books = listRunbooks();
    const runbookMetrics =
      context === "runbooks"
        ? runbookAmbientMetrics({
            catalogCount: books.length,
            grcCatalogCount: books.filter((book) => book.slug.startsWith("grc-")).length,
            openIncidents,
          })
        : null;
    const copilotFields =
      context === "copilot"
        ? copilotAmbientFieldsFromConnectors([], false, 0)
        : null;
    const settingsFields =
      context === "settings"
        ? settingsAmbientMetrics({
            setupStepsComplete: 0,
            setupStepsTotal: 4,
            hasApiKey: false,
            hasIngestToken: false,
            profileComplete: false,
            connectorsConfigured: 0,
            connectorsUp: 0,
            openaiEnabled: Boolean(process.env.OPENAI_API_KEY?.trim()),
            signedIn: false,
          })
        : null;

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
      auditEntryCount: 0,
      slackFailedCount: 0,
      hoursSinceLastEvent: null,
      canExportAudit: false,
      latestAuditEventType: null,
      runbookCatalogCount: runbookMetrics?.catalogCount,
      grcRunbookCount: runbookMetrics?.grcCatalogCount,
      openWithoutRunbook: runbookMetrics?.openWithoutRunbook,
      hotWithoutRunbook: runbookMetrics?.hotWithoutRunbook,
      runbookLinkageCoveragePct: runbookMetrics?.linkageCoveragePct,
      copilotAssistantMode: copilotFields?.copilotAssistantMode,
      copilotThreadCount: copilotFields?.copilotThreadCount,
      reasoningConfigured: copilotFields?.reasoningConfigured,
      reasoningUp: copilotFields?.reasoningUp,
      setupStepsComplete: settingsFields?.setupStepsComplete,
      setupStepsTotal: settingsFields?.setupStepsTotal,
      hasApiKey: settingsFields?.hasApiKey,
      hasIngestToken: settingsFields?.hasIngestToken,
      profileComplete: settingsFields?.profileComplete,
      openaiEnabled: settingsFields?.openaiEnabled,
    });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const settingsFields =
      context === "settings"
        ? settingsAmbientMetrics({
            setupStepsComplete: 0,
            setupStepsTotal: 4,
            hasApiKey: false,
            hasIngestToken: false,
            profileComplete: false,
            connectorsConfigured: 0,
            connectorsUp: 0,
            openaiEnabled: Boolean(process.env.OPENAI_API_KEY?.trim()),
            signedIn: false,
          })
        : null;
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
      setupStepsComplete: settingsFields?.setupStepsComplete,
      setupStepsTotal: settingsFields?.setupStepsTotal,
      hasApiKey: settingsFields?.hasApiKey,
      hasIngestToken: settingsFields?.hasIngestToken,
      profileComplete: settingsFields?.profileComplete,
      openaiEnabled: settingsFields?.openaiEnabled,
    });
  }

  const orgContext = await getOrgContextForUser(user.id);
  const orgId = orgContext.orgId;
  const [{ rows: incidents }, connectors, approvals, copilotThreadCount] = await Promise.all([
    listIncidentsForUser(user.id, null, orgId),
    getConnectorHealthRows(),
    listApprovalsForUser({
      userId: user.id,
      devTenantId: null,
      orgId,
      orgRole: orgContext.role,
    }),
    context === "copilot" ? countCopilotThreadsForUser(supabase, user.id) : Promise.resolve(0),
  ]);

  const connectorsConfigured = connectors.filter((c) => c.baseUrl).length;
  const connectorsUp = connectors.filter((c) => c.ok === true).length;

  const settingsFields =
    context === "settings"
      ? await loadSettingsAmbientFields(supabase, user, connectorsConfigured, connectorsUp)
      : null;

  const dryRuns = await listAutomationDryRuns(supabase, { userId: user.id, orgId });
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

  let auditEntryCount = 0;
  let slackFailedCount = 0;
  let hoursSinceLastEvent: number | null = null;
  let canExportAudit = canExportOrgAuditLog(orgContext.role);
  let latestAuditEventType: string | null = null;
  if (context === "audit") {
    const sinceIso = auditSinceIsoFromWindow("30d");
    const audit = await listAuditEntriesForUser(user.id, {
      orgId,
      orgRole: orgContext.role,
      sinceIso,
    });
    const auditMetrics = auditAmbientMetrics({
      rows: audit.rows.map((row) => ({ action: row.action, ts: row.ts })),
      canExport: canExportAudit,
    });
    auditEntryCount = auditMetrics.auditEntryCount;
    slackFailedCount = auditMetrics.slackFailedCount;
    hoursSinceLastEvent = auditMetrics.hoursSinceLastEvent;
    canExportAudit = auditMetrics.canExportAudit;
    latestAuditEventType = auditMetrics.latestEventType;
  }

  let runbookCatalogCount = 0;
  let grcRunbookCount = 0;
  let openWithoutRunbook = 0;
  let hotWithoutRunbook = 0;
  let runbookLinkageCoveragePct = 100;
  if (context === "runbooks") {
    const books = listRunbooks();
    const openIncidents = incidents.filter((row) => row.status !== "resolved");
    const metrics = runbookAmbientMetrics({
      catalogCount: books.length,
      grcCatalogCount: books.filter((book) => book.slug.startsWith("grc-")).length,
      openIncidents,
    });
    runbookCatalogCount = metrics.catalogCount;
    grcRunbookCount = metrics.grcCatalogCount;
    openWithoutRunbook = metrics.openWithoutRunbook;
    hotWithoutRunbook = metrics.hotWithoutRunbook;
    runbookLinkageCoveragePct = metrics.linkageCoveragePct;
  }

  const copilotFields =
    context === "copilot"
      ? copilotAmbientFieldsFromConnectors(connectors, true, copilotThreadCount)
      : null;

  const open = incidents.filter((r) => r.status !== "resolved").length;
  const hot = incidents.filter((r) => r.severity === "critical" || r.severity === "high").length;
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
    auditEntryCount,
    slackFailedCount,
    hoursSinceLastEvent,
    canExportAudit,
    latestAuditEventType,
    runbookCatalogCount,
    grcRunbookCount,
    openWithoutRunbook,
    hotWithoutRunbook,
    runbookLinkageCoveragePct,
    copilotAssistantMode: copilotFields?.copilotAssistantMode,
    copilotThreadCount: copilotFields?.copilotThreadCount,
    reasoningConfigured: copilotFields?.reasoningConfigured,
    reasoningUp: copilotFields?.reasoningUp,
    setupStepsComplete: settingsFields?.setupStepsComplete,
    setupStepsTotal: settingsFields?.setupStepsTotal,
    hasApiKey: settingsFields?.hasApiKey,
    hasIngestToken: settingsFields?.hasIngestToken,
    profileComplete: settingsFields?.profileComplete,
    openaiEnabled: settingsFields?.openaiEnabled,
  });
}
