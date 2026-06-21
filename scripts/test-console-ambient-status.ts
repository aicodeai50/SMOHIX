import {
  approvalAmbientMetrics,
  auditAmbientMetrics,
  buildConsoleAmbientSnapshot,
  classifyConsoleAmbientHealth,
  classifyConsoleAmbientHealthForContext,
  consoleAmbientHeadline,
  CONSOLE_AMBIENT_STATUS_VERSION,
  copilotAmbientMetrics,
  dryRunAmbientMetrics,
  runbookAmbientMetrics,
  settingsAmbientMetrics,
} from "../lib/console/ambient-status";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(
  classifyConsoleAmbientHealth({
    hotIncidents: 1,
    openIncidents: 2,
    pendingApprovals: 0,
    criticalBurnServices: 0,
    connectorsConfigured: 2,
    connectorsUp: 2,
  }) === "critical",
  "hot incident → critical",
);

assert(
  classifyConsoleAmbientHealth({
    hotIncidents: 0,
    openIncidents: 2,
    pendingApprovals: 1,
    criticalBurnServices: 0,
    connectorsConfigured: 1,
    connectorsUp: 1,
  }) === "attention",
  "open + pending → attention",
);

assert(
  classifyConsoleAmbientHealth({
    hotIncidents: 0,
    openIncidents: 0,
    pendingApprovals: 0,
    criticalBurnServices: 0,
    connectorsConfigured: 0,
    connectorsUp: 0,
  }) === "nominal",
  "clear → nominal",
);

const snapshot = buildConsoleAmbientSnapshot({
  openIncidents: 3,
  hotIncidents: 0,
  totalIncidents: 10,
  pendingApprovals: 2,
  connectorsUp: 2,
  connectorsConfigured: 3,
  dryRunSuccessRate: 92,
  dryRunCount: 12,
  criticalBurnServices: 0,
  signedIn: true,
});

assert(snapshot.health === "attention", "snapshot attention");
assert(snapshot.phases.length >= 5, "phases populated");
assert(snapshot.headline === consoleAmbientHeadline("attention"), "headline");
assert(
  consoleAmbientHeadline("critical", "incidents", { openIncidents: 2, hotIncidents: 1 }).includes(
    "1 critical/high",
  ),
  "incidents critical headline",
);
assert(
  consoleAmbientHeadline("nominal", "incidents", { openIncidents: 0, hotIncidents: 0 }).includes(
    "queue clear",
  ),
  "incidents nominal headline",
);

const incidentsSnapshot = buildConsoleAmbientSnapshot({
  openIncidents: 2,
  hotIncidents: 1,
  totalIncidents: 5,
  pendingApprovals: 0,
  connectorsUp: 1,
  connectorsConfigured: 1,
  dryRunSuccessRate: 100,
  dryRunCount: 1,
  criticalBurnServices: 0,
  signedIn: true,
  context: "incidents",
});
assert(incidentsSnapshot.phases[0]?.value.includes("hot"), "incidents phase shows hot count");

assert(
  classifyConsoleAmbientHealthForContext(
    {
      hotIncidents: 0,
      openIncidents: 0,
      pendingApprovals: 2,
      criticalBurnServices: 0,
      connectorsConfigured: 0,
      connectorsUp: 0,
      pendingHighRisk: 1,
    },
    "approvals",
  ) === "critical",
  "approvals high-risk → critical",
);

const approvalMetrics = approvalAmbientMetrics([
  {
    decisionBrief: {
      riskScore: 80,
      policyChecks: [{ passed: true }],
    },
  },
  {
    decisionBrief: {
      riskScore: 40,
      policyChecks: [{ passed: false }],
    },
  },
]);
assert(approvalMetrics.pendingHighRisk === 1, "approval metrics high-risk");
assert(approvalMetrics.pendingPolicyGaps === 1, "approval metrics policy gaps");

const approvalsSnapshot = buildConsoleAmbientSnapshot({
  openIncidents: 0,
  hotIncidents: 0,
  totalIncidents: 0,
  pendingApprovals: 2,
  pendingHighRisk: 1,
  pendingPolicyGaps: 0,
  connectorsUp: 1,
  connectorsConfigured: 1,
  dryRunSuccessRate: 100,
  dryRunCount: 1,
  criticalBurnServices: 0,
  signedIn: true,
  context: "approvals",
});
assert(approvalsSnapshot.phases[0]?.label === "APPROVALS", "approvals phase first");
assert(
  consoleAmbientHeadline("critical", "approvals", {
    pendingApprovals: 2,
    pendingHighRisk: 1,
  }).includes("high-risk"),
  "approvals critical headline",
);

assert(
  classifyConsoleAmbientHealthForContext(
    {
      hotIncidents: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      criticalBurnServices: 1,
      connectorsConfigured: 2,
      connectorsUp: 2,
      warningBurnServices: 0,
    },
    "services",
  ) === "critical",
  "services critical burn → critical",
);

const servicesSnapshot = buildConsoleAmbientSnapshot({
  openIncidents: 1,
  hotIncidents: 0,
  totalIncidents: 3,
  pendingApprovals: 0,
  connectorsUp: 2,
  connectorsConfigured: 2,
  dryRunSuccessRate: 100,
  dryRunCount: 2,
  criticalBurnServices: 0,
  warningBurnServices: 2,
  totalServices: 5,
  servicesWithSlo: 4,
  signedIn: true,
  context: "services",
});
assert(servicesSnapshot.phases[0]?.label === "SLO BURN", "services phase first");
assert(
  consoleAmbientHeadline("attention", "services", { warningBurnServices: 2 }).includes("warning burn"),
  "services attention headline",
);

assert(
  classifyConsoleAmbientHealthForContext(
    {
      hotIncidents: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      criticalBurnServices: 0,
      connectorsConfigured: 2,
      connectorsUp: 0,
      dryRunCount: 5,
      dryRunSuccessRate: 40,
    },
    "automations",
  ) === "critical",
  "automations low dry-run success → critical",
);

const dryRunMetrics = dryRunAmbientMetrics([{ ok: true }, { ok: false }, { ok: true }]);
assert(dryRunMetrics.dryRunCount === 3, "dry-run metrics count");
assert(dryRunMetrics.dryRunSuccessRate === 67, "dry-run metrics success rate");
assert(dryRunMetrics.dryRunFailures === 1, "dry-run metrics failures");

const automationsSnapshot = buildConsoleAmbientSnapshot({
  openIncidents: 0,
  hotIncidents: 0,
  totalIncidents: 0,
  pendingApprovals: 1,
  connectorsUp: 1,
  connectorsConfigured: 1,
  dryRunSuccessRate: 72,
  dryRunCount: 4,
  criticalBurnServices: 0,
  signedIn: true,
  context: "automations",
});
assert(automationsSnapshot.phases[0]?.label === "DRY-RUNS", "automations phase first");
assert(
  consoleAmbientHeadline("attention", "automations", {
    pendingApprovals: 1,
    dryRunCount: 4,
    dryRunFailures: 1,
  }).includes("approval"),
  "automations approval headline",
);

assert(
  classifyConsoleAmbientHealthForContext(
    {
      hotIncidents: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      criticalBurnServices: 0,
      connectorsConfigured: 0,
      connectorsUp: 0,
      slackFailedCount: 2,
      signedIn: true,
    },
    "audit",
  ) === "critical",
  "audit slack failures → critical",
);

const auditMetrics = auditAmbientMetrics({
  rows: [
    { action: "automation.dry_run", ts: new Date().toISOString() },
    { action: "slack.failed", ts: new Date().toISOString() },
  ],
  canExport: true,
});
assert(auditMetrics.auditEntryCount === 2, "audit metrics count");
assert(auditMetrics.slackFailedCount === 1, "audit metrics slack failed");

const auditSnapshot = buildConsoleAmbientSnapshot({
  openIncidents: 1,
  hotIncidents: 0,
  totalIncidents: 2,
  pendingApprovals: 0,
  connectorsUp: 1,
  connectorsConfigured: 1,
  dryRunSuccessRate: 100,
  dryRunCount: 1,
  criticalBurnServices: 0,
  signedIn: true,
  context: "audit",
  auditEntryCount: 12,
  slackFailedCount: 0,
  hoursSinceLastEvent: 2,
  canExportAudit: true,
  latestAuditEventType: "approval.approved",
});
assert(auditSnapshot.phases[0]?.label === "TRAIL", "audit phase first");
assert(
  consoleAmbientHeadline("nominal", "audit", {
    auditEntryCount: 5,
    hoursSinceLastEvent: 1,
    canExportAudit: true,
  }).includes("export ready"),
  "audit nominal headline",
);

assert(
  classifyConsoleAmbientHealthForContext(
    {
      hotIncidents: 1,
      openIncidents: 2,
      pendingApprovals: 0,
      criticalBurnServices: 0,
      connectorsConfigured: 0,
      connectorsUp: 0,
      hotWithoutRunbook: 1,
    },
    "runbooks",
  ) === "critical",
  "runbooks hot without linkage → critical",
);

const runbookMetrics = runbookAmbientMetrics({
  catalogCount: 6,
  grcCatalogCount: 3,
  openIncidents: [
    { severity: "high", runbookSlug: null },
    { severity: "medium", runbookSlug: "api-latency" },
  ],
});
assert(runbookMetrics.openWithoutRunbook === 1, "runbook metrics unlinked");
assert(runbookMetrics.linkageCoveragePct === 50, "runbook metrics coverage");

const runbooksSnapshot = buildConsoleAmbientSnapshot({
  openIncidents: 2,
  hotIncidents: 1,
  totalIncidents: 4,
  pendingApprovals: 0,
  connectorsUp: 1,
  connectorsConfigured: 1,
  dryRunSuccessRate: 100,
  dryRunCount: 0,
  criticalBurnServices: 0,
  signedIn: true,
  context: "runbooks",
  runbookCatalogCount: 6,
  grcRunbookCount: 3,
  openWithoutRunbook: 0,
  hotWithoutRunbook: 0,
  runbookLinkageCoveragePct: 100,
});
assert(runbooksSnapshot.phases[0]?.label === "CATALOG", "runbooks phase first");

const copilotMetrics = copilotAmbientMetrics({
  openaiEnabled: true,
  reasoningConfigured: true,
  reasoningUp: true,
  signedIn: true,
  copilotThreadCount: 2,
});
assert(copilotMetrics.assistantMode === "cloud", "copilot metrics cloud when openai");
assert(copilotMetrics.copilotThreadCount === 2, "copilot metrics thread count");

assert(
  classifyConsoleAmbientHealthForContext(
    {
      hotIncidents: 1,
      openIncidents: 1,
      pendingApprovals: 0,
      criticalBurnServices: 0,
      connectorsConfigured: 1,
      connectorsUp: 1,
      copilotAssistantMode: "reasoning",
      reasoningConfigured: true,
      reasoningUp: false,
      signedIn: true,
    },
    "copilot",
  ) === "critical",
  "copilot hot + reasoning down → critical",
);

const copilotSnapshot = buildConsoleAmbientSnapshot({
  openIncidents: 0,
  hotIncidents: 0,
  totalIncidents: 0,
  pendingApprovals: 0,
  connectorsUp: 1,
  connectorsConfigured: 1,
  dryRunSuccessRate: 100,
  dryRunCount: 0,
  criticalBurnServices: 0,
  signedIn: true,
  context: "copilot",
  copilotAssistantMode: "cloud",
  copilotThreadCount: 3,
  reasoningConfigured: false,
  reasoningUp: null,
});
assert(copilotSnapshot.phases[0]?.label === "ASSISTANT", "copilot phase first");
assert(
  consoleAmbientHeadline("nominal", "copilot", {
    copilotAssistantMode: "cloud",
    copilotThreadCount: 3,
  }).includes("3 saved threads"),
  "copilot nominal cloud headline",
);

const settingsMetrics = settingsAmbientMetrics({
  setupStepsComplete: 3,
  setupStepsTotal: 4,
  hasApiKey: true,
  hasIngestToken: true,
  profileComplete: true,
  connectorsConfigured: 1,
  connectorsUp: 1,
  openaiEnabled: false,
  signedIn: true,
});
assert(settingsMetrics.setupStepsComplete === 3, "settings metrics setup count");

assert(
  classifyConsoleAmbientHealthForContext(
    {
      hotIncidents: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      criticalBurnServices: 0,
      connectorsConfigured: 2,
      connectorsUp: 0,
      signedIn: true,
      setupStepsComplete: 4,
      setupStepsTotal: 4,
    },
    "settings",
  ) === "critical",
  "settings all connectors down → critical",
);

assert(
  classifyConsoleAmbientHealthForContext(
    {
      hotIncidents: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      criticalBurnServices: 0,
      connectorsConfigured: 0,
      connectorsUp: 0,
      signedIn: true,
      setupStepsComplete: 2,
      setupStepsTotal: 4,
    },
    "settings",
  ) === "attention",
  "settings incomplete setup → attention",
);

const settingsSnapshot = buildConsoleAmbientSnapshot({
  openIncidents: 0,
  hotIncidents: 0,
  totalIncidents: 0,
  pendingApprovals: 0,
  connectorsUp: 1,
  connectorsConfigured: 1,
  dryRunSuccessRate: 100,
  dryRunCount: 0,
  criticalBurnServices: 0,
  signedIn: true,
  context: "settings",
  setupStepsComplete: 4,
  setupStepsTotal: 4,
  hasApiKey: true,
  hasIngestToken: true,
  profileComplete: true,
  openaiEnabled: true,
});
assert(settingsSnapshot.phases[0]?.label === "SETUP", "settings phase first");
assert(
  consoleAmbientHeadline("nominal", "settings", {
    setupStepsComplete: 4,
    setupStepsTotal: 4,
  }).includes("Workspace configured"),
  "settings nominal headline",
);

assert(snapshot.version === CONSOLE_AMBIENT_STATUS_VERSION, "version");

console.log("test-console-ambient-status: ok");
