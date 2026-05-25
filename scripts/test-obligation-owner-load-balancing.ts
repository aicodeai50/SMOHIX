import { startOfUtcWeek } from "../lib/compliance/board-obligation-forecast";
import {
  buildFrameworkPrimaryAccountables,
  buildLoadBalancingSuggestions,
  buildObligationOwnerLoadBalancingFromParts,
  buildOwnerLoadSlices,
  filterPeakWeekObligations,
  OBLIGATION_OWNER_LOAD_BALANCING_VERSION,
} from "../lib/compliance/obligation-owner-load-balancing";
import type { ControlOwnershipRow } from "../lib/compliance/control-ownership-matrix";
import type { RegulatoryObligationItem } from "../lib/compliance/regulatory-obligation-heatmap";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const now = new Date("2026-05-20T12:00:00.000Z");
const peakWeekKey = startOfUtcWeek("2026-06-03T00:00:00.000Z");
const currentWeekKey = startOfUtcWeek(now.toISOString());

const items: RegulatoryObligationItem[] = [
  {
    id: "o1",
    dimension: "testing",
    bucketKey: "checkpoint",
    bucketLabel: "SOC",
    title: "SOC checkpoint A",
    dueAt: "2026-06-03T00:00:00.000Z",
    urgency: "upcoming",
    statusLabel: "upcoming",
    href: "/governance/compliance/testing-schedules",
    framework: "soc2",
    vendorTier: null,
    testingKind: "framework_checkpoint",
  },
  {
    id: "o2",
    dimension: "testing",
    bucketKey: "checkpoint",
    bucketLabel: "SOC",
    title: "SOC checkpoint B",
    dueAt: "2026-06-04T00:00:00.000Z",
    urgency: "upcoming",
    statusLabel: "upcoming",
    href: "/governance/compliance/testing-schedules",
    framework: "soc2",
    vendorTier: null,
    testingKind: "framework_checkpoint",
  },
  {
    id: "o3",
    dimension: "assessor",
    bucketKey: "iso",
    bucketLabel: "ISO",
    title: "ISO request",
    dueAt: "2026-06-05T00:00:00.000Z",
    urgency: "upcoming",
    statusLabel: "upcoming",
    href: "/governance/compliance/evidence-requests",
    framework: "iso27001",
    vendorTier: null,
    testingKind: null,
  },
  {
    id: "o4",
    dimension: "testing",
    bucketKey: "checkpoint",
    bucketLabel: "SOC",
    title: "SOC checkpoint C",
    dueAt: "2026-06-06T00:00:00.000Z",
    urgency: "upcoming",
    statusLabel: "upcoming",
    href: "/governance/compliance/testing-schedules",
    framework: "soc2",
    vendorTier: null,
    testingKind: "framework_checkpoint",
  },
];

const peak = filterPeakWeekObligations({ items, peakWeekKey, currentWeekKey });
assert(peak.length === 4, "all in peak week");

const rows = [
  {
    framework: "soc2" as const,
    accountableUserId: "user-a",
    accountable: "Alice",
  },
  {
    framework: "soc2" as const,
    accountableUserId: "user-a",
    accountable: "Alice",
  },
  {
    framework: "iso27001" as const,
    accountableUserId: "user-b",
    accountable: "Bob",
  },
] as Pick<ControlOwnershipRow, "framework" | "accountableUserId" | "accountable">[];

const frameworkOwners = buildFrameworkPrimaryAccountables(rows as ControlOwnershipRow[]);
assert(frameworkOwners.length === 2, "two frameworks");
assert(
  frameworkOwners.find((f) => f.framework === "soc2")?.userId === "user-a",
  "alice owns soc2",
);

const pack = buildObligationOwnerLoadBalancingFromParts({
  orgId: "org-1",
  horizonDays: 90,
  hoursPerObligation: 2,
  items,
  peakWeekKey,
  peakWeekLabel: "peak",
  frameworkOwners,
  members: [
    { userId: "user-a", role: "owner", email: "a@test.com", displayName: "Alice" },
    { userId: "user-b", role: "admin", email: "b@test.com", displayName: "Bob" },
  ],
  now,
});

assert(pack.version === OBLIGATION_OWNER_LOAD_BALANCING_VERSION, "version");
assert(pack.peakWeekObligationCount === 4, "peak count");
assert(pack.ownerLoads.some((o) => o.userId === "user-a" && o.peakWeekObligationCount === 3), "alice load");

const slices = buildOwnerLoadSlices({
  assignments: pack.assignments,
  frameworkOwners,
  hoursPerObligation: 2,
});
assert(slices.length >= 2, "multiple owners");

const suggestions = buildLoadBalancingSuggestions({
  assignments: pack.assignments,
  ownerLoads: pack.ownerLoads,
  frameworkOwners,
});
assert(suggestions.length >= 1, "has rebalance suggestion");

assert(
  isPathAllowedForAuditor("/governance/compliance/obligation-load-balancing"),
  "auditor path",
);

console.log("test-obligation-owner-load-balancing: ok");
