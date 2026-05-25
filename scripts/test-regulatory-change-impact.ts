import {
  REGULATORY_CHANGE_SCENARIOS,
  buildRegulatoryChangeImpactPackFromBaselines,
  simulateRegulatoryScenario,
} from "../lib/compliance/regulatory-change-impact";
import type { FrameworkBaselineRow } from "../lib/compliance/baseline-comparison";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const baselines: FrameworkBaselineRow[] = [
  {
    framework: "soc2",
    label: "SOC 2 Type II",
    consolePath: "/governance/compliance/type-ii",
    controlCount: 10,
    readinessPercent: 72,
    priorReadinessPercent: 70,
    readinessDelta: 2,
    covered: 5,
    partial: 2,
    none: 3,
    improved: 1,
    unchanged: 7,
    regressed: 0,
    exceptionCount: 3,
    weakestDomain: "Monitoring",
    auditEventsScanned: 10,
    acceptedPolicyCount: 1,
  },
];

const coverage = new Map<string, "covered" | "partial" | "none">([
  ["soc2:CC7.2", "covered"],
  ["pcidss:10.2.1", "partial"],
  ["hipaa:164.308a1", "none"],
]);

const scenario = REGULATORY_CHANGE_SCENARIOS.find((s) => s.id === "pci-dss-4-logging");
assert(Boolean(scenario), "pci logging scenario exists");

const result = simulateRegulatoryScenario(scenario!, coverage, new Map(baselines.map((b) => [b.framework, b])));
assert(result.rows.length > 0, "simulated rows");
assert(result.projectedReadinessDrop >= 0, "readiness drop non-negative");

const pack = buildRegulatoryChangeImpactPackFromBaselines({
  orgId: "org-1",
  periodDays: 30,
  coverageByControl: coverage,
  baselines,
});
assert(pack.results.length === REGULATORY_CHANGE_SCENARIOS.length, "all scenarios ranked");
assert(pack.highestImpactScenarioId !== null, "highest impact id");

assert(
  isPathAllowedForAuditor("/governance/compliance/regulatory-impact"),
  "auditor can open regulatory impact",
);

console.log("test-regulatory-change-impact: all checks passed");
