import {
  buildConsoleAmbientSnapshot,
  classifyConsoleAmbientHealth,
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

assert(snapshot.version === CONSOLE_AMBIENT_STATUS_VERSION, "version");

console.log("test-console-ambient-status: ok");
