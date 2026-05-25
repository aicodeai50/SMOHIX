import { simulateAttackPaths } from "../lib/attack-paths/simulate";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const services = [
  { id: "s-edge", name: "edge-gateway", description: null, environment: "staging", ownerHint: null, updated: "now" },
  { id: "s-api", name: "checkout-api", description: null, environment: "production", ownerHint: null, updated: "now" },
  { id: "s-db", name: "payments-db", description: null, environment: "production", ownerHint: null, updated: "now" },
];

const edges = [
  {
    fromServiceId: "s-api",
    fromServiceName: "checkout-api",
    toServiceId: "s-edge",
    toServiceName: "edge-gateway",
    relationship: "runtime" as const,
    criticality: "high" as const,
  },
  {
    fromServiceId: "s-api",
    fromServiceName: "checkout-api",
    toServiceId: "s-db",
    toServiceName: "payments-db",
    relationship: "data" as const,
    criticality: "high" as const,
  },
];

const entryFindingsByService = new Map([
  [
    "s-edge",
    [{ id: "f1", title: "RCE", severity: "critical", cveId: "CVE-2026-0001" }],
  ],
]);

const paths = simulateAttackPaths({
  services,
  edges,
  entryFindingsByService,
  maxDepth: 5,
});

assert(paths.length >= 1, "expects at least one attack path");
assert(
  paths[0]?.targetServiceId === "s-api" || paths[0]?.targetServiceId === "s-db",
  "targets production service",
);
assert(paths[0]!.riskScore > 0, "risk score positive");
assert(paths[0]!.steps.length >= 2, "path has entry + pivot");

const empty = simulateAttackPaths({
  services,
  edges: [],
  entryFindingsByService,
});
assert(empty.length === 0, "no edges means no pivot paths beyond entry");

console.log("test-attack-path-sim: all checks passed");
