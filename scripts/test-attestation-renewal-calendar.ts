import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import type { ControlAttestationRow } from "../lib/compliance/attestation/types";
import {
  buildAttestationRenewalCalendarFromRows,
  buildAttestationRenewalWaves,
  classifyRenewalItem,
  summarizeFrameworkRenewals,
  attestationRenewalCalendarToCsv,
  ATTESTATION_RENEWAL_CALENDAR_VERSION,
} from "../lib/compliance/attestation-renewal-calendar";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const control = COMPLIANCE_CONTROLS[0];
const now = new Date();
const dueSoon = new Date(now.getTime() + 10 * 86_400_000).toISOString();
const dueOverdue = new Date(now.getTime() - 2 * 86_400_000).toISOString();

function row(overrides: Partial<ControlAttestationRow> & { dueAt: string; status: ControlAttestationRow["status"] }): ControlAttestationRow {
  return {
    id: overrides.id ?? "att-1",
    orgId: "org-1",
    controlId: control.id,
    control,
    ownerUserId: overrides.ownerUserId ?? "user-1",
    ownerLabel: overrides.ownerLabel ?? "Alex Owner",
    dueAt: overrides.dueAt,
    attestedAt: overrides.attestedAt ?? null,
    attestedBy: overrides.attestedBy ?? null,
    attestationNote: null,
    status: overrides.status,
    linkedAuditEvidenceCount: 0,
    auditEvidenceHref: "/audit",
  };
}

const pending = classifyRenewalItem(row({ dueAt: dueSoon, status: "pending" }), 90, now);
assert(pending?.renewalKind === "initial", "pending is initial");

const overdue = classifyRenewalItem(row({ dueAt: dueOverdue, status: "overdue" }), 90, now);
assert(overdue?.renewalKind === "overdue", "overdue kind");

const far = classifyRenewalItem(row({ dueAt: new Date(now.getTime() + 120 * 86_400_000).toISOString(), status: "pending" }), 90, now);
assert(far === null, "outside horizon excluded");

const pack = buildAttestationRenewalCalendarFromRows({
  orgId: "org-1",
  horizonDays: 90,
  rows: [
    row({ id: "a1", dueAt: dueSoon, status: "pending" }),
    row({ id: "a2", dueAt: dueOverdue, status: "overdue", ownerUserId: null, ownerLabel: null }),
  ],
});

assert(pack.version === ATTESTATION_RENEWAL_CALENDAR_VERSION, "version");
assert(pack.totalRenewals === 2, "two renewals");
assert(pack.overdueCount === 1, "one overdue");
assert(pack.waves.length >= 1, "at least one wave");

const csv = attestationRenewalCalendarToCsv(pack);
assert(csv.includes("wave_id"), "csv header");

const waves = buildAttestationRenewalWaves(pack.waves.flatMap((w) => w.items));
assert(waves.length === pack.waves.length, "wave rebuild consistent");

const summaries = summarizeFrameworkRenewals(pack.waves.flatMap((w) => w.items));
assert(summaries.length >= 1, "framework summary");

assert(
  isPathAllowedForAuditor("/governance/compliance/attestation-renewal"),
  "auditor path",
);

console.log("test-attestation-renewal-calendar: all checks passed");
