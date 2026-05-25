import type { AcceptedPolicyGuardrails } from "../lib/approvals/policy-suggestions";
import {
  buildControlDependencyGraphPackFromParts,
  buildControlGraphNodes,
  buildCrosswalkEdges,
  buildSharedAuditEdgesFromEventTypes,
  buildSharedPolicyEdges,
  buildThematicEdges,
  controlDependencyGraphToCsv,
  mergeControlGraphEdges,
  summarizeFrameworkPairs,
} from "../lib/compliance/control-dependency-graph";
import { complianceControlsForAuditEvent } from "../lib/compliance/map-audit";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const crosswalk = buildCrosswalkEdges();
assert(crosswalk.length > 0, "crosswalk edges");
assert(crosswalk.every((e) => e.kind === "crosswalk"), "crosswalk kind");

const thematic = buildThematicEdges();
assert(thematic.length > 0, "thematic edges");
assert(thematic.some((e) => e.crossFramework), "thematic cross-framework");

const auditEdges = buildSharedAuditEdgesFromEventTypes([
  { event_type: "governance.compliance_exported" },
  { event_type: "governance.compliance_exported" },
]);
assert(auditEdges.length > 0, "shared audit from compliance export events");

const controls = complianceControlsForAuditEvent("governance.compliance_exported");
assert(controls.length >= 2, "export event maps to multiple controls");

const guardrails: AcceptedPolicyGuardrails = {
  playbookId: "pb-test",
  maxBlastRadius: null,
  requireDryRunFresh: true,
  requireChangeWindow: true,
  suggestionIds: ["s1"],
};
const policyEdges = buildSharedPolicyEdges({ "pb-test": guardrails });
assert(policyEdges.length > 0, "shared policy edges from blast-radius playbook");

const merged = mergeControlGraphEdges([...crosswalk, ...thematic, ...auditEdges, ...policyEdges]);
assert(merged.length <= crosswalk.length + thematic.length + auditEdges.length + policyEdges.length, "deduped");

const nodes = buildControlGraphNodes(new Map(), merged);
const connected = nodes.filter((n) => n.degree > 0);
assert(connected.length > 0, "nodes have degree");

const pairs = summarizeFrameworkPairs(merged);
assert(pairs.length > 0, "framework pair summary");

const pack = buildControlDependencyGraphPackFromParts({
  orgId: "org-1",
  periodDays: 30,
  auditEventsScanned: 2,
  acceptedPolicyCount: 1,
  nodes,
  edges: merged.slice(0, 50),
});
assert(pack.hubControlIds.length > 0, "hub controls");
assert(pack.crossFrameworkEdgeCount > 0, "cross-framework count");

const csv = controlDependencyGraphToCsv(pack);
assert(csv.includes("source_id,target_id"), "csv header");
assert(csv.split("\n").length > 2, "csv rows");

assert(
  isPathAllowedForAuditor("/governance/compliance/control-graph"),
  "auditor can open control graph",
);

console.log("test-control-dependency-graph: all checks passed");
