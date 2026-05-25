import type { ControlAttestationRow } from "../lib/compliance/attestation/types";
import {
  ATTESTATION_COLLECTION_LEAD_DAYS,
  buildAttestationTestingSchedules,
  buildControlTestingSchedulesPackFromParts,
  buildFrameworkCheckpointSchedules,
  buildFreshnessRetestSchedules,
  buildScheduledBundleTesting,
  mergeControlTestingSchedules,
} from "../lib/compliance/control-testing-schedules";
import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const control = COMPLIANCE_CONTROLS[0];
const dueFuture = new Date(Date.now() + 20 * 86_400_000).toISOString();

const attestation: ControlAttestationRow = {
  id: "att-1",
  orgId: "org-1",
  controlId: control.id,
  control,
  ownerUserId: null,
  ownerLabel: null,
  dueAt: dueFuture,
  attestedAt: null,
  attestedBy: null,
  attestationNote: null,
  status: "pending",
  linkedAuditEvidenceCount: 0,
  auditEvidenceHref: "/audit",
};

const attSchedules = buildAttestationTestingSchedules([attestation]);
assert(attSchedules.length === 1, "attestation window schedule");
assert(attSchedules[0].controlCount === 1, "one control in window");
assert(attSchedules[0].kind === "attestation_evidence", "attestation kind");

const overdueAtt: ControlAttestationRow = {
  ...attestation,
  id: "att-2",
  dueAt: new Date(Date.now() - 86_400_000).toISOString(),
  status: "overdue",
};
const overdueSchedules = buildAttestationTestingSchedules([overdueAtt]);
assert(overdueSchedules[0].status === "overdue", "overdue attestation schedule");

const checkpoints = buildFrameworkCheckpointSchedules();
assert(checkpoints.length === 8, "eight framework checkpoints");

const freshness = buildFreshnessRetestSchedules(["soc2:CC7.2"]);
assert(freshness.length === 1, "freshness retest schedule");

const bundleNew = buildScheduledBundleTesting(null);
assert(bundleNew[0].status === "due", "initial bundle due");

const bundleCadence = buildScheduledBundleTesting(
  new Date(Date.now() - 40 * 86_400_000).toISOString(),
);
assert(bundleCadence[0].status === "overdue", "overdue bundle cadence");

const merged = mergeControlTestingSchedules([
  ...attSchedules,
  ...checkpoints.slice(0, 1),
  ...freshness,
  ...bundleCadence,
]);
assert(merged[0].status === "overdue" || merged[0].status === "due", "merged sorted by urgency");

const pack = buildControlTestingSchedulesPackFromParts({
  orgId: "org-1",
  horizonDays: 90,
  schedules: merged,
});
assert(pack.schedules.length === merged.length, "pack schedule count");
assert(pack.attestationScheduleCount >= 1, "attestation count");

assert(
  ATTESTATION_COLLECTION_LEAD_DAYS === 14,
  "14d lead before attestation",
);

assert(
  isPathAllowedForAuditor("/governance/compliance/testing-schedules"),
  "auditor can open testing schedules",
);

console.log("test-control-testing-schedules: all checks passed");
