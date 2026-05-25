import type { ControlAttestationRow } from "../lib/compliance/attestation/types";
import {
  buildConsultedLabels,
  buildControlOwnershipMatrixPackFromParts,
  buildControlOwnershipRow,
  buildControlToScopeIndex,
  buildResponsibleLabels,
  computeOwnershipCompleteness,
  memberDisplayLabel,
} from "../lib/compliance/control-ownership-matrix";
import type { ScopeBoundarySystem } from "../lib/compliance/scope-boundary-mapper";
import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import { computeAttestationStatus } from "../lib/compliance/attestation/status";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";
import type { OrgMemberRow } from "../lib/org/data";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const control = COMPLIANCE_CONTROLS[0]!;

const mockSystem: ScopeBoundarySystem = {
  id: "service-svc-1",
  kind: "service",
  name: "API Gateway",
  inScope: true,
  zone: "production",
  environment: "production",
  detail: "Core API",
  linkedServiceId: "svc-1",
  openFindingCount: 0,
  controlIds: [control.id],
  frameworks: [control.framework],
  href: "/services",
};

const index = buildControlToScopeIndex([mockSystem], []);
assert(index.get(control.id)?.length === 1, "scope index");

const members: OrgMemberRow[] = [
  { userId: "u1", role: "owner", email: "owner@test", displayName: "Owner" },
  { userId: "u2", role: "auditor", email: "audit@test", displayName: "Auditor" },
];

const consulted = buildConsultedLabels(members);
assert(consulted.length === 1 && consulted[0]!.includes("Owner"), "consulted owner");

assert(
  computeOwnershipCompleteness({
    accountableUserId: "u1",
    responsibleCount: 1,
    attestationStatus: "attested",
    consultedCount: 1,
  }) === 100,
  "full completeness",
);

const attestation: ControlAttestationRow = {
  id: "att-1",
  orgId: "org-1",
  controlId: control.id,
  control,
  ownerUserId: "u1",
  ownerLabel: "Owner",
  dueAt: new Date().toISOString(),
  attestedAt: new Date().toISOString(),
  attestedBy: "u1",
  attestationNote: null,
  status: computeAttestationStatus({
    dueAtIso: new Date().toISOString(),
    attestedAtIso: new Date().toISOString(),
  }),
  linkedAuditEvidenceCount: 0,
  auditEvidenceHref: "/audit",
};

const servicesById = new Map([
  [
    "svc-1",
    {
      id: "svc-1",
      name: "API Gateway",
      description: null,
      environment: "production",
      ownerHint: "Platform team",
      updated: "today",
    },
  ],
]);

const row = buildControlOwnershipRow(
  attestation,
  index.get(control.id) ?? [],
  servicesById,
  members,
);

assert(row.responsible[0]!.includes("Platform team"), "responsible includes owner hint");
assert(row.completenessPercent >= 75, "high completeness");
assert(memberDisplayLabel(members[0]!) === "Owner", "member label");

const responsible = buildResponsibleLabels(index.get(control.id) ?? [], servicesById);
assert(responsible.length === 1, "responsible labels");

const pack = buildControlOwnershipMatrixPackFromParts({
  orgId: "org-1",
  rows: [row],
});

assert(pack.totalControls === 1, "pack controls");
assert(pack.frameworkSummaries.length === 1, "framework summary");

assert(isPathAllowedForAuditor("/governance/compliance/control-ownership"), "auditor path");

console.log("test-control-ownership-matrix: all checks passed");
