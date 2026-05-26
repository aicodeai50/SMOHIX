export const CONSOLE_AMBIENT_STATUS_VERSION = "zentro-console-ambient-status/1";

export type ConsoleAmbientContext = "default" | "incidents" | "approvals" | "services" | "automations" | "audit" | "runbooks";

export type ConsoleAmbientHealth = "nominal" | "attention" | "critical";

export type ConsoleAmbientPhase = {
  label: string;
  value: string;
};

export type ConsoleAmbientSnapshot = {
  version: typeof CONSOLE_AMBIENT_STATUS_VERSION;
  generatedAt: string;
  health: ConsoleAmbientHealth;
  headline: string;
  phases: ConsoleAmbientPhase[];
};

export function classifyConsoleAmbientHealth(input: {
  hotIncidents: number;
  openIncidents: number;
  pendingApprovals: number;
  criticalBurnServices: number;
  connectorsConfigured: number;
  connectorsUp: number;
}): ConsoleAmbientHealth {
  if (
    input.hotIncidents > 0 ||
    input.criticalBurnServices > 0 ||
    (input.connectorsConfigured > 0 && input.connectorsUp === 0)
  ) {
    return "critical";
  }
  if (input.openIncidents > 0 || input.pendingApprovals > 0) {
    return "attention";
  }
  return "nominal";
}

export type ConsoleAmbientCounts = {
  openIncidents?: number;
  hotIncidents?: number;
  pendingApprovals?: number;
  pendingHighRisk?: number;
  pendingPolicyGaps?: number;
  totalServices?: number;
  servicesWithSlo?: number;
  criticalBurnServices?: number;
  warningBurnServices?: number;
  dryRunCount?: number;
  dryRunSuccessRate?: number;
  dryRunFailures?: number;
  auditEntryCount?: number;
  slackFailedCount?: number;
  hoursSinceLastEvent?: number | null;
  canExportAudit?: boolean;
  runbookCatalogCount?: number;
  openWithoutRunbook?: number;
  hotWithoutRunbook?: number;
  runbookLinkageCoveragePct?: number;
  grcRunbookCount?: number;
};

export function classifyConsoleAmbientHealthForContext(
  input: {
    hotIncidents: number;
    openIncidents: number;
    pendingApprovals: number;
    criticalBurnServices: number;
    connectorsConfigured: number;
    connectorsUp: number;
    pendingHighRisk?: number;
    pendingPolicyGaps?: number;
    warningBurnServices?: number;
    dryRunCount?: number;
    dryRunSuccessRate?: number;
    auditEntryCount?: number;
    slackFailedCount?: number;
    hoursSinceLastEvent?: number | null;
    signedIn?: boolean;
    runbookCatalogCount?: number;
    openWithoutRunbook?: number;
    hotWithoutRunbook?: number;
  },
  context: ConsoleAmbientContext = "default",
): ConsoleAmbientHealth {
  if (context === "runbooks") {
    const hotWithoutRunbook = input.hotWithoutRunbook ?? 0;
    const openWithoutRunbook = input.openWithoutRunbook ?? 0;
    if (hotWithoutRunbook > 0) {
      return "critical";
    }
    if (openWithoutRunbook > 0) {
      return "attention";
    }
    return "nominal";
  }
  if (context === "audit") {
    const slackFailed = input.slackFailedCount ?? 0;
    if (slackFailed > 0) {
      return "critical";
    }
    if (!input.signedIn) {
      return "attention";
    }
    const count = input.auditEntryCount ?? 0;
    const hours = input.hoursSinceLastEvent;
    if (count === 0) {
      return "attention";
    }
    if (hours != null && hours > 168) {
      return "attention";
    }
    return "nominal";
  }
  if (context === "automations") {
    const dryRunCount = input.dryRunCount ?? 0;
    const dryRunSuccessRate = input.dryRunSuccessRate ?? 100;
    if (
      (dryRunCount >= 3 && dryRunSuccessRate < 50) ||
      (input.connectorsConfigured > 0 && input.connectorsUp === 0)
    ) {
      return "critical";
    }
    if (
      (dryRunCount > 0 && dryRunSuccessRate < 90) ||
      input.pendingApprovals > 0 ||
      dryRunCount === 0
    ) {
      return "attention";
    }
    return "nominal";
  }
  if (context === "services") {
    if (
      input.criticalBurnServices > 0 ||
      (input.connectorsConfigured > 0 && input.connectorsUp === 0)
    ) {
      return "critical";
    }
    if ((input.warningBurnServices ?? 0) > 0) {
      return "attention";
    }
    return "nominal";
  }
  if (context === "approvals") {
    if ((input.pendingHighRisk ?? 0) > 0 || (input.pendingPolicyGaps ?? 0) > 0) {
      return "critical";
    }
    if (input.pendingApprovals > 0) {
      return "attention";
    }
    return "nominal";
  }
  return classifyConsoleAmbientHealth(input);
}

export function consoleAmbientHeadline(
  health: ConsoleAmbientHealth,
  context: ConsoleAmbientContext = "default",
  counts?: ConsoleAmbientCounts,
): string {
  if (context === "runbooks") {
    const catalog = counts?.runbookCatalogCount ?? 0;
    const openWithout = counts?.openWithoutRunbook ?? 0;
    const hotWithout = counts?.hotWithoutRunbook ?? 0;
    const coverage = counts?.runbookLinkageCoveragePct ?? 100;
    if (health === "critical") {
      return `${hotWithout} critical/high incident${hotWithout === 1 ? "" : "s"} missing a linked runbook`;
    }
    if (health === "attention") {
      return `${openWithout} open incident${openWithout === 1 ? "" : "s"} need runbook linkage — ${coverage}% of queue linked`;
    }
    return catalog > 0
      ? `${catalog} versioned procedures ready — open incidents linked to runbooks`
      : "Runbook catalog empty — add procedures to guide incident response";
  }
  if (context === "audit") {
    const count = counts?.auditEntryCount ?? 0;
    const slackFailed = counts?.slackFailedCount ?? 0;
    const hours = counts?.hoursSinceLastEvent;
    const canExport = counts?.canExportAudit ?? false;
    if (health === "critical") {
      return `${slackFailed} Slack delivery failure${slackFailed === 1 ? "" : "s"} in the audit trail`;
    }
    if (health === "attention") {
      if (count === 0) {
        return canExport
          ? "Audit trail empty — run guarded actions to populate append-only events"
          : "No audit events in scope — actions will appear as your role allows";
      }
      if (hours != null && hours > 168) {
        return "No audit events in 7 days — verify automations and approvals are emitting";
      }
      return "Session audit trail — sign in to persist org-scoped append-only events";
    }
    const recency =
      hours == null ? "recent activity" : hours < 1 ? "just now" : hours < 24 ? `${Math.round(hours)}h ago` : `${Math.round(hours / 24)}d ago`;
    return canExport
      ? `Append-only trail active · latest event ${recency} · export ready`
      : `Append-only trail active · latest event ${recency}`;
  }
  if (context === "automations") {
    const dryRunCount = counts?.dryRunCount ?? 0;
    const dryRunSuccessRate = counts?.dryRunSuccessRate ?? 100;
    const dryRunFailures = counts?.dryRunFailures ?? 0;
    const pending = counts?.pendingApprovals ?? 0;
    if (health === "critical") {
      if (dryRunCount >= 3 && dryRunSuccessRate < 50) {
        return `Dry-run success at ${dryRunSuccessRate}% — review playbook guardrails`;
      }
      return "Automation connector unhealthy — robot service unreachable";
    }
    if (health === "attention") {
      if (pending > 0) {
        return `${pending} approval${pending === 1 ? "" : "s"} blocking guarded execution`;
      }
      if (dryRunCount > 0 && dryRunFailures > 0) {
        return `${dryRunFailures} recent dry-run failure${dryRunFailures === 1 ? "" : "s"} — inspect before execute`;
      }
      if (dryRunCount === 0) {
        return "Ready for dry-run — validate playbooks before production execution";
      }
    }
    return dryRunCount > 0
      ? "Dry-run posture strong — guardrails holding"
      : "Automation console ready — dry-run first, execute with approval";
  }
  if (context === "services") {
    const critical = counts?.criticalBurnServices ?? 0;
    const warning = counts?.warningBurnServices ?? 0;
    const catalog = counts?.totalServices ?? 0;
    if (health === "critical") {
      if (critical > 0) {
        return `${critical} service${critical === 1 ? "" : "s"} in critical error budget burn`;
      }
      return "Connector health critical — alert ingest may be impaired";
    }
    if (health === "attention") {
      return warning > 0
        ? `${warning} service${warning === 1 ? "" : "s"} at warning burn — review SLO posture`
        : "Review service catalog, SLO targets, and dependency edges";
    }
    return catalog > 0
      ? "Service catalog healthy — SLOs within budget"
      : "Add services to the catalog and wire alert ingest";
  }
  if (context === "approvals") {
    const pending = counts?.pendingApprovals ?? 0;
    const highRisk = counts?.pendingHighRisk ?? 0;
    const policyGaps = counts?.pendingPolicyGaps ?? 0;
    if (health === "critical") {
      if (highRisk > 0) {
        return `${highRisk} high-risk approval${highRisk === 1 ? "" : "s"} need immediate review`;
      }
      if (policyGaps > 0) {
        return `${policyGaps} pending request${policyGaps === 1 ? "" : "s"} missing policy checks`;
      }
      return "Critical approval signals require response";
    }
    if (health === "attention") {
      return pending > 0
        ? `${pending} approval${pending === 1 ? "" : "s"} awaiting human decision`
        : "Review pending change requests and guardrails";
    }
    return "Approval queue clear — guardrails enforced";
  }
  if (context === "incidents") {
    if (health === "critical") {
      const hot = counts?.hotIncidents ?? 0;
      return hot > 0
        ? `${hot} critical/high incident${hot === 1 ? "" : "s"} need immediate triage`
        : "Critical incident signals require response";
    }
    if (health === "attention") {
      const open = counts?.openIncidents ?? 0;
      return open > 0
        ? `${open} open incident${open === 1 ? "" : "s"} in the response queue`
        : "Active incident workload — review timelines and ownership";
    }
    return "Incident queue clear — no active response workload";
  }
  if (health === "critical") return "Critical signals require response";
  if (health === "attention") return "Active workload — review queue and incidents";
  return "Operational posture nominal";
}

export function dryRunAmbientMetrics(runs: readonly { ok: boolean }[]): {
  dryRunCount: number;
  dryRunSuccessRate: number;
  dryRunFailures: number;
} {
  const dryRunCount = runs.length;
  const successful = runs.filter((run) => run.ok).length;
  const dryRunSuccessRate =
    dryRunCount > 0 ? Math.round((successful / dryRunCount) * 100) : 0;
  return {
    dryRunCount,
    dryRunSuccessRate,
    dryRunFailures: dryRunCount - successful,
  };
}

function hoursSinceIso(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

export function formatAuditRecency(hours: number | null): string {
  if (hours === null) return "no events";
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function runbookAmbientMetrics(input: {
  catalogCount: number;
  grcCatalogCount: number;
  openIncidents: readonly {
    severity: string;
    runbookSlug?: string | null;
  }[];
}): {
  catalogCount: number;
  grcCatalogCount: number;
  openWithoutRunbook: number;
  hotWithoutRunbook: number;
  linkageCoveragePct: number;
} {
  const openWithoutRunbook = input.openIncidents.filter((row) => !row.runbookSlug?.trim()).length;
  const hotWithoutRunbook = input.openIncidents.filter(
    (row) =>
      !row.runbookSlug?.trim() &&
      (row.severity === "critical" || row.severity === "high"),
  ).length;
  const linked = input.openIncidents.length - openWithoutRunbook;
  const linkageCoveragePct =
    input.openIncidents.length > 0
      ? Math.round((linked / input.openIncidents.length) * 100)
      : 100;
  return {
    catalogCount: input.catalogCount,
    grcCatalogCount: input.grcCatalogCount,
    openWithoutRunbook,
    hotWithoutRunbook,
    linkageCoveragePct,
  };
}

export function auditAmbientMetrics(input: {
  rows: readonly { action: string; ts: string }[];
  canExport: boolean;
}): {
  auditEntryCount: number;
  slackFailedCount: number;
  hoursSinceLastEvent: number | null;
  canExportAudit: boolean;
  latestEventType: string | null;
} {
  const auditEntryCount = input.rows.length;
  const slackFailedCount = input.rows.filter((row) => row.action === "slack.failed").length;
  const hoursSinceLastEvent =
    auditEntryCount > 0 ? hoursSinceIso(input.rows[0]!.ts) : null;
  return {
    auditEntryCount,
    slackFailedCount,
    hoursSinceLastEvent,
    canExportAudit: input.canExport,
    latestEventType: auditEntryCount > 0 ? input.rows[0]!.action : null,
  };
}

export function approvalAmbientMetrics(
  pending: readonly {
    decisionBrief: {
      riskScore: number;
      policyChecks: readonly { passed: boolean }[];
    };
  }[],
): {
  pendingApprovals: number;
  pendingHighRisk: number;
  pendingPolicyGaps: number;
} {
  return {
    pendingApprovals: pending.length,
    pendingHighRisk: pending.filter((p) => p.decisionBrief.riskScore >= 70).length,
    pendingPolicyGaps: pending.filter((p) =>
      p.decisionBrief.policyChecks.some((check) => !check.passed),
    ).length,
  };
}

export function buildConsoleAmbientSnapshot(input: {
  openIncidents: number;
  hotIncidents: number;
  totalIncidents: number;
  pendingApprovals: number;
  connectorsUp: number;
  connectorsConfigured: number;
  dryRunSuccessRate: number;
  dryRunCount: number;
  criticalBurnServices: number;
  signedIn: boolean;
  context?: ConsoleAmbientContext;
  pendingHighRisk?: number;
  pendingPolicyGaps?: number;
  warningBurnServices?: number;
  totalServices?: number;
  servicesWithSlo?: number;
  generatedAt?: string;
  auditEntryCount?: number;
  slackFailedCount?: number;
  hoursSinceLastEvent?: number | null;
  canExportAudit?: boolean;
  latestAuditEventType?: string | null;
  runbookCatalogCount?: number;
  grcRunbookCount?: number;
  openWithoutRunbook?: number;
  hotWithoutRunbook?: number;
  runbookLinkageCoveragePct?: number;
}): ConsoleAmbientSnapshot {
  const context = input.context ?? "default";
  const health = classifyConsoleAmbientHealthForContext(
    {
      hotIncidents: input.hotIncidents,
      openIncidents: input.openIncidents,
      pendingApprovals: input.pendingApprovals,
      criticalBurnServices: input.criticalBurnServices,
      connectorsConfigured: input.connectorsConfigured,
      connectorsUp: input.connectorsUp,
      pendingHighRisk: input.pendingHighRisk,
      pendingPolicyGaps: input.pendingPolicyGaps,
      warningBurnServices: input.warningBurnServices,
      dryRunCount: input.dryRunCount,
      dryRunSuccessRate: input.dryRunSuccessRate,
      auditEntryCount: input.auditEntryCount,
      slackFailedCount: input.slackFailedCount,
      hoursSinceLastEvent: input.hoursSinceLastEvent,
      signedIn: input.signedIn,
      openWithoutRunbook: input.openWithoutRunbook,
      hotWithoutRunbook: input.hotWithoutRunbook,
    },
    context,
  );

  const runbookCatalogPhaseValue = `${input.runbookCatalogCount ?? 0} procedure${input.runbookCatalogCount === 1 ? "" : "s"} · ${input.grcRunbookCount ?? 0} GRC`;
  const runbookLinkagePhaseValue =
    (input.openIncidents ?? 0) === 0
      ? "no open incidents"
      : (input.openWithoutRunbook ?? 0) > 0
        ? `${input.runbookLinkageCoveragePct ?? 100}% linked · ${input.openWithoutRunbook} unlinked`
        : "all open incidents linked";

  const auditTrailPhaseValue =
    (input.auditEntryCount ?? 0) > 0
      ? `${input.auditEntryCount} events · ${formatAuditRecency(input.hoursSinceLastEvent ?? null)}`
      : "no events in window";
  const auditExportPhaseValue = input.canExportAudit ? "CSV export allowed" : "export restricted";
  const auditSlackPhaseValue =
    (input.slackFailedCount ?? 0) > 0
      ? `${input.slackFailedCount} failed`
      : (input.auditEntryCount ?? 0) > 0
        ? "delivery healthy"
        : "no slack events";
  const auditWhisperPhaseValue = input.latestAuditEventType
    ? input.latestAuditEventType.replace(/\./g, " · ")
    : "awaiting first event";

  const dryRunFailures = Math.max(0, input.dryRunCount - Math.round((input.dryRunCount * input.dryRunSuccessRate) / 100));
  const dryRunPhaseValue =
    input.dryRunCount > 0
      ? dryRunFailures > 0
        ? `${input.dryRunSuccessRate}% success · ${dryRunFailures} failed`
        : `${input.dryRunSuccessRate}% success · ${input.dryRunCount} runs`
      : "no runs yet";

  const sloPhaseValue =
    input.criticalBurnServices > 0
      ? `${input.criticalBurnServices} critical${(input.warningBurnServices ?? 0) > 0 ? ` · ${input.warningBurnServices} warning` : ""}`
      : (input.warningBurnServices ?? 0) > 0
        ? `${input.warningBurnServices} warning`
        : (input.servicesWithSlo ?? 0) > 0
          ? `${input.servicesWithSlo} SLO-covered · within budget`
          : "no SLOs configured";

  const approvalPhaseValue =
    input.pendingApprovals > 0
      ? input.pendingHighRisk && input.pendingHighRisk > 0
        ? `${input.pendingApprovals} pending · ${input.pendingHighRisk} high-risk`
        : input.pendingPolicyGaps && input.pendingPolicyGaps > 0
          ? `${input.pendingApprovals} pending · ${input.pendingPolicyGaps} policy gap${input.pendingPolicyGaps === 1 ? "" : "s"}`
          : `${input.pendingApprovals} pending`
      : "queue clear";

  const signedInPhases: ConsoleAmbientPhase[] = [
    {
      label: "INCIDENTS",
      value:
        input.hotIncidents > 0
          ? `${input.hotIncidents} hot · ${input.openIncidents} open`
          : `${input.openIncidents} open · ${input.totalIncidents} total`,
    },
    {
      label: "APPROVALS",
      value: approvalPhaseValue,
    },
    {
      label: "CONNECTORS",
      value:
        input.connectorsConfigured === 0
          ? "none configured"
          : `${input.connectorsUp}/${input.connectorsConfigured} healthy`,
    },
    {
      label: "DRY-RUNS",
      value: input.dryRunCount > 0 ? `${input.dryRunSuccessRate}% success` : "no runs yet",
    },
    {
      label: "GUARDRAILS",
      value: input.signedIn ? "policy enforced" : "local session",
    },
    { label: "AUDIT", value: "append-only" },
  ];

  const phases: ConsoleAmbientPhase[] = input.signedIn
    ? context === "runbooks"
      ? [
          { label: "CATALOG", value: runbookCatalogPhaseValue },
          { label: "LINKAGE", value: runbookLinkagePhaseValue },
          signedInPhases[0]!,
          { label: "VERSIONS", value: "in-repo catalog" },
          { label: "GRC", value: "gap runbooks available" },
          signedInPhases[5]!,
        ]
      : context === "audit"
      ? [
          { label: "TRAIL", value: auditTrailPhaseValue },
          { label: "EXPORT", value: auditExportPhaseValue },
          { label: "SLACK", value: auditSlackPhaseValue },
          { label: "GUARDRAILS", value: "append-only" },
          { label: "WHISPER", value: auditWhisperPhaseValue },
          signedInPhases[0]!,
        ]
      : context === "automations"
      ? [
          { label: "DRY-RUNS", value: dryRunPhaseValue },
          { label: "GUARDRAILS", value: signedInPhases[4]!.value },
          signedInPhases[1]!,
          signedInPhases[2]!,
          signedInPhases[0]!,
          signedInPhases[5]!,
        ]
      : context === "services"
      ? [
          { label: "SLO BURN", value: sloPhaseValue },
          signedInPhases[2]!,
          {
            label: "CATALOG",
            value: `${input.totalServices ?? 0} service${input.totalServices === 1 ? "" : "s"}`,
          },
          signedInPhases[0]!,
          signedInPhases[1]!,
          signedInPhases[5]!,
        ]
      : context === "approvals"
      ? [
          signedInPhases[1]!,
          { label: "GUARDRAILS", value: signedInPhases[4]!.value },
          signedInPhases[0]!,
          signedInPhases[2]!,
          signedInPhases[3]!,
          signedInPhases[5]!,
        ]
      : signedInPhases
    : context === "runbooks"
      ? [
          { label: "CATALOG", value: runbookCatalogPhaseValue },
          { label: "LINKAGE", value: runbookLinkagePhaseValue },
          { label: "MODE", value: "LOCAL SESSION" },
          { label: "STORAGE", value: "in-repo catalog" },
        ]
      : context === "audit"
      ? [
          { label: "TRAIL", value: "session mode" },
          { label: "MODE", value: "LOCAL SESSION" },
          { label: "EXPORT", value: "sign in required" },
          { label: "GUARDRAILS", value: "append-only" },
        ]
      : context === "automations"
      ? [
          { label: "DRY-RUNS", value: dryRunPhaseValue },
          { label: "MODE", value: "LOCAL SESSION" },
          { label: "GUARDRAILS", value: "dry-run first" },
          { label: "AUDIT", value: "session trail" },
        ]
      : [
        { label: "MODE", value: "LOCAL SESSION" },
        { label: "ACCOUNTS", value: "optional sign-in" },
        { label: "GUARDRAILS", value: "dry-run first" },
        { label: "AUDIT", value: "session trail" },
      ];

  return {
    version: CONSOLE_AMBIENT_STATUS_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    health,
    headline: consoleAmbientHeadline(health, context, {
      openIncidents: input.openIncidents,
      hotIncidents: input.hotIncidents,
      pendingApprovals: input.pendingApprovals,
      pendingHighRisk: input.pendingHighRisk,
      pendingPolicyGaps: input.pendingPolicyGaps,
      totalServices: input.totalServices,
      servicesWithSlo: input.servicesWithSlo,
      criticalBurnServices: input.criticalBurnServices,
      warningBurnServices: input.warningBurnServices,
      dryRunCount: input.dryRunCount,
      dryRunSuccessRate: input.dryRunSuccessRate,
      dryRunFailures,
      auditEntryCount: input.auditEntryCount,
      slackFailedCount: input.slackFailedCount,
      hoursSinceLastEvent: input.hoursSinceLastEvent,
      canExportAudit: input.canExportAudit,
      runbookCatalogCount: input.runbookCatalogCount,
      openWithoutRunbook: input.openWithoutRunbook,
      hotWithoutRunbook: input.hotWithoutRunbook,
      runbookLinkageCoveragePct: input.runbookLinkageCoveragePct,
    }),
    phases,
  };
}
