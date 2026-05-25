import {
  approvalAmbientMetrics,
  buildConsoleAmbientSnapshot,
  classifyConsoleAmbientHealth,
  classifyConsoleAmbientHealthForContext,
  consoleAmbientHeadline,
  CONSOLE_AMBIENT_STATUS_VERSION,
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

assert(snapshot.version === CONSOLE_AMBIENT_STATUS_VERSION, "version");

console.log("test-console-ambient-status: ok");
