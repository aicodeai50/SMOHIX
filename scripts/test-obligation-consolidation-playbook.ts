import {
  buildConsolidationPlaybookSteps,
  buildObligationConsolidationPlaybookFromParts,
  clusterKeyFor,
  stepsCompletedForStatus,
  suggestConsolidationRunbook,
} from "../lib/compliance/obligation-consolidation-playbook";
import type { ObligationCrossoverCluster } from "../lib/compliance/obligation-crossover-report";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";
import { isRunbookSlugValid } from "../lib/runbooks/catalog";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const cluster: ObligationCrossoverCluster = {
  id: "cluster-1",
  kind: "shared_control",
  theme: "cross_framework_control_link",
  windowStart: "2026-05-20T00:00:00.000Z",
  windowEnd: "2026-05-24T00:00:00.000Z",
  controlIds: ["soc2:CC6.1", "iso:A.5.15"],
  controlRefs: ["CC6.1", "A.5.15"],
  frameworks: ["soc2", "iso27001"],
  obligationIds: ["a", "b"],
  obligationCount: 2,
  overdueCount: 1,
  evidenceReuseNote: "Collect once for CC6.1 / A.5.15.",
};

assert(stepsCompletedForStatus("in_progress") === 2, "in_progress completes 2 steps");
assert(stepsCompletedForStatus("collected") === 5, "collected completes 5 steps");

const steps = buildConsolidationPlaybookSteps(cluster, "in_progress");
assert(steps.length === 6, "six playbook steps");
assert(steps[0]!.completed && steps[1]!.completed && !steps[2]!.completed, "step completion bands");

const keyA = clusterKeyFor(cluster);
const keyB = clusterKeyFor(cluster);
assert(keyA === keyB, "stable cluster key");

const suggestion = suggestConsolidationRunbook(cluster);
assert(isRunbookSlugValid(suggestion.runbookSlug), "valid runbook slug");
assert(suggestion.playbookId === "pb-cache-flush", "overdue suggests cache flush");

const pack = buildObligationConsolidationPlaybookFromParts({
  orgId: "org-1",
  horizonDays: 90,
  clusters: [cluster],
  plays: [],
});

assert(pack.workflowCount === 1, "one workflow");
assert(pack.workflows[0]!.steps.length === 6, "workflow has steps");
assert(pack.stats.planned === 1, "untracked counts as planned");

assert(
  isPathAllowedForAuditor("/governance/compliance/obligation-consolidation"),
  "auditor path",
);

console.log("test-obligation-consolidation-playbook: ok");
