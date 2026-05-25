import {
  buildInheritedControlCoverageGapPackFromVendors,
  classifyInheritedControlGap,
  expectedReadinessFloorForTier,
} from "../lib/compliance/inherited-control-coverage-gaps";
import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import type { ThirdPartyVendorRow, VendorControlRow } from "../lib/third-party-risk/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const control = COMPLIANCE_CONTROLS[0]!;

function mockControl(overrides: Partial<VendorControlRow>): VendorControlRow {
  return {
    controlId: control.id,
    control,
    source: "inherited",
    attestationStatus: null,
    linkedAuditEvidenceCount: 0,
    auditEvidenceHref: "/audit",
    ...overrides,
  };
}

const noEvidence = classifyInheritedControlGap(
  mockControl({ linkedAuditEvidenceCount: 0 }),
  "critical",
);
assert(noEvidence === "no_audit_evidence", "no evidence gap");

const overdue = classifyInheritedControlGap(
  mockControl({ attestationStatus: "overdue", linkedAuditEvidenceCount: 2 }),
  "high",
);
assert(overdue === "overdue_attestation", "overdue gap");

const notAttested = classifyInheritedControlGap(
  mockControl({ attestationStatus: "pending", linkedAuditEvidenceCount: 3 }),
  "critical",
);
assert(notAttested === "not_attested", "not attested on critical");

const okLow = classifyInheritedControlGap(
  mockControl({ linkedAuditEvidenceCount: 2, attestationStatus: "pending" }),
  "low",
);
assert(okLow === null, "low tier pending ok with evidence");

assert(expectedReadinessFloorForTier("critical") === 80, "critical floor");

const vendor: ThirdPartyVendorRow = {
  id: "v1",
  orgId: "org-1",
  name: "Acme Cloud",
  category: "cloud",
  riskTier: "critical",
  status: "active",
  reviewDueAt: null,
  contactEmail: null,
  notes: null,
  createdAt: new Date().toISOString(),
  controls: [
    mockControl({ linkedAuditEvidenceCount: 0 }),
    mockControl({
      controlId: "soc2:CC6.1",
      control: COMPLIANCE_CONTROLS.find((c) => c.id === "soc2:CC6.1")!,
      linkedAuditEvidenceCount: 5,
      attestationStatus: "attested",
    }),
  ],
  controlCount: 2,
  attestedControlCount: 1,
  reusedEvidenceCount: 5,
  readinessPercent: 50,
};

const pack = buildInheritedControlCoverageGapPackFromVendors({
  orgId: "org-1",
  periodDays: 30,
  vendors: [vendor],
});

assert(pack.totalGapCount >= 1, "at least one gap");
assert(pack.vendorsWithGaps === 1, "vendor has gaps");

assert(isPathAllowedForAuditor("/governance/compliance/inherited-control-gaps"), "auditor path");

console.log("test-inherited-control-coverage-gaps: all checks passed");
