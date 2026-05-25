import {
  buildAssessorEvidenceRequestPackFromRows,
  computeEvidenceRequestStatus,
  defaultEvidenceRequestDueAt,
  documentTypeLabel,
  isEvidenceDocumentType,
  mapDbRequestToRow,
} from "../lib/compliance/assessor-evidence-requests";
import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const control = COMPLIANCE_CONTROLS.find((c) => c.id === "soc2:CC6.1")!;

assert(isEvidenceDocumentType("control_evidence"), "doc type");
assert(documentTypeLabel("audit_export") === "Audit log export", "doc label");

assert(
  computeEvidenceRequestStatus({
    storedStatus: "open",
    dueAtIso: new Date(Date.now() + 86_400_000).toISOString(),
  }) === "open",
  "open status",
);

assert(
  computeEvidenceRequestStatus({
    storedStatus: "open",
    dueAtIso: new Date(Date.now() - 86_400_000).toISOString(),
  }) === "overdue",
  "overdue status",
);

const now = new Date().toISOString();
const row = mapDbRequestToRow(
  {
    id: "req-1",
    org_id: "org-1",
    control_id: control.id,
    title: "Access review logs",
    description: "Need Q1 export",
    document_type: "audit_export",
    status: "open",
    requested_by: "u-auditor",
    assigned_to: "u-op",
    due_at: defaultEvidenceRequestDueAt(7),
    fulfilled_at: null,
    fulfilled_by: null,
    fulfillment_note: null,
    created_at: now,
    updated_at: now,
  },
  [
    { userId: "u-auditor", role: "auditor", email: "a@test", displayName: "Auditor" },
    { userId: "u-op", role: "operator", email: "o@test", displayName: "Operator" },
  ],
);

assert(row !== null && row.controlRef === "CC6.1", "mapped row");
if (!row) throw new Error("row missing");
assert(row.assignedToLabel === "Operator", "assignee label");

const pack = buildAssessorEvidenceRequestPackFromRows({
  orgId: "org-1",
  rows: [row],
});

assert(pack.openCount + pack.overdueCount >= 1, "open or overdue count");

assert(isPathAllowedForAuditor("/governance/compliance/evidence-requests"), "auditor path");

console.log("test-assessor-evidence-requests: all checks passed");
