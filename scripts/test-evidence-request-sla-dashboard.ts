import {
  buildAssessorEvidenceRequestPackFromRows,
  computeEvidenceRequestStatus,
  defaultEvidenceRequestDueAt,
  mapDbRequestToRow,
} from "../lib/compliance/assessor-evidence-requests";
import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import {
  buildAuditorEvidenceRequestSlaDigestMarkdown,
  buildEvidenceRequestSlaDashboardFromRows,
  classifyEvidenceRequestSla,
  EVIDENCE_REQUEST_SLA_DASHBOARD_VERSION,
  evidenceRequestSlaDashboardToCsv,
} from "../lib/compliance/evidence-request-sla-dashboard";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const control = COMPLIANCE_CONTROLS.find((c) => c.id === "soc2:CC6.1")!;
const now = new Date().toISOString();
const members = [
  { userId: "u-auditor", role: "auditor" as const, email: "a@test", displayName: "Auditor" },
  { userId: "u-op", role: "operator" as const, email: "o@test", displayName: "Operator" },
];

const overdueRow = mapDbRequestToRow(
  {
    id: "req-overdue",
    org_id: "org-1",
    control_id: control.id,
    title: "Access logs",
    description: null,
    document_type: "audit_export",
    status: "open",
    requested_by: "u-auditor",
    assigned_to: "u-op",
    due_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    fulfilled_at: null,
    fulfilled_by: null,
    fulfillment_note: null,
    created_at: now,
    updated_at: now,
  },
  members,
)!;

const atRiskRow = mapDbRequestToRow(
  {
    id: "req-risk",
    org_id: "org-1",
    control_id: control.id,
    title: "Policy pack",
    description: null,
    document_type: "policy_document",
    status: "open",
    requested_by: "u-auditor",
    assigned_to: null,
    due_at: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    fulfilled_at: null,
    fulfilled_by: null,
    fulfillment_note: null,
    created_at: now,
    updated_at: now,
  },
  members,
)!;

const fulfilledRow = mapDbRequestToRow(
  {
    id: "req-done",
    org_id: "org-1",
    control_id: control.id,
    title: "Done doc",
    description: null,
    document_type: "control_evidence",
    status: "fulfilled",
    requested_by: "u-auditor",
    assigned_to: "u-op",
    due_at: defaultEvidenceRequestDueAt(14),
    fulfilled_at: new Date(Date.now() - 86_400_000).toISOString(),
    fulfilled_by: "u-op",
    fulfillment_note: "attached",
    created_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    updated_at: now,
  },
  members,
)!;

assert(classifyEvidenceRequestSla(overdueRow, 3) === "overdue", "overdue bucket");
assert(classifyEvidenceRequestSla(atRiskRow, 3) === "at_risk", "at risk bucket");
assert(classifyEvidenceRequestSla(fulfilledRow, 3) === "fulfilled_on_time", "on time fulfill");

const pack = buildEvidenceRequestSlaDashboardFromRows({
  orgId: "org-1",
  rows: [overdueRow, atRiskRow, fulfilledRow],
  atRiskDays: 3,
});

assert(pack.version === EVIDENCE_REQUEST_SLA_DASHBOARD_VERSION, "version");
assert(pack.overdueCount === 1, "one overdue");
assert(pack.atRiskCount === 1, "one at risk");
assert(pack.fulfilledCount === 1, "one fulfilled");
assert(pack.overdueQueue[0].daysOverdue >= 1, "days overdue set");

const csv = evidenceRequestSlaDashboardToCsv(pack);
assert(csv.includes("overdue"), "csv overdue section");

const digest = buildAuditorEvidenceRequestSlaDigestMarkdown(pack, "Acme");
assert(digest.includes("Overdue queue"), "digest markdown");

assert(
  isPathAllowedForAuditor("/governance/compliance/evidence-request-sla"),
  "auditor path",
);

const requestPack = buildAssessorEvidenceRequestPackFromRows({
  orgId: "org-1",
  rows: [overdueRow],
});
assert(
  computeEvidenceRequestStatus({
    storedStatus: "open",
    dueAtIso: overdueRow.dueAt,
  }) === "overdue",
  "workflow overdue",
);
assert(requestPack.overdueCount === 1, "request pack overdue");

console.log("test-evidence-request-sla-dashboard: all checks passed");
