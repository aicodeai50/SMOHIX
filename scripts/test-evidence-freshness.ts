import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import {
  buildControlEvidenceFreshnessRow,
  computeEvidenceFreshnessBand,
  DEFAULT_AGING_DAYS,
  DEFAULT_STALE_DAYS,
  evidenceFreshnessToCsv,
  EVIDENCE_FRESHNESS_VERSION,
} from "../lib/compliance/evidence-freshness";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const control = COMPLIANCE_CONTROLS[0];
assert(Boolean(control), "catalog has controls");

const now = new Date("2026-05-24T12:00:00.000Z");
const recent = new Date("2026-05-20T12:00:00.000Z").toISOString();
const old = new Date("2026-04-01T12:00:00.000Z").toISOString();

assert(
  computeEvidenceFreshnessBand({
    effectiveLastEvidenceAt: recent,
    hasAnyEvidence30d: true,
    staleDays: DEFAULT_STALE_DAYS,
    agingDays: DEFAULT_AGING_DAYS,
    now,
  }) === "fresh",
  "recent evidence is fresh",
);

assert(
  computeEvidenceFreshnessBand({
    effectiveLastEvidenceAt: old,
    hasAnyEvidence30d: true,
    staleDays: DEFAULT_STALE_DAYS,
    agingDays: DEFAULT_AGING_DAYS,
    now,
  }) === "stale",
  "old evidence is stale",
);

assert(
  computeEvidenceFreshnessBand({
    effectiveLastEvidenceAt: null,
    hasAnyEvidence30d: false,
    staleDays: DEFAULT_STALE_DAYS,
    agingDays: DEFAULT_AGING_DAYS,
    now,
  }) === "none",
  "no evidence is none",
);

const row = buildControlEvidenceFreshnessRow({
  control,
  coverageStatus30d: "partial",
  auditEvidenceCount30d: 2,
  policyEvidenceCount: 0,
  lastAuditEvidenceAt: old,
  lastPolicyEvidenceAt: null,
  staleDays: DEFAULT_STALE_DAYS,
  agingDays: DEFAULT_AGING_DAYS,
});
assert(row.freshness === "stale", "row builder marks stale");
assert(row.daysSinceEvidence !== null && row.daysSinceEvidence > 30, "days since computed");

const csv = evidenceFreshnessToCsv({
  version: EVIDENCE_FRESHNESS_VERSION,
  generatedAt: now.toISOString(),
  periodDays: 30,
  staleDays: DEFAULT_STALE_DAYS,
  agingDays: DEFAULT_AGING_DAYS,
  orgId: "org-1",
  auditEventsScanned: 0,
  summary: { total: 1, fresh: 0, aging: 0, stale: 1, none: 0 },
  byFramework: [],
  staleQueue: [row],
  rows: [row],
});
assert(csv.includes("freshness"), "csv has freshness column");
assert(csv.includes(control.id), "csv has control id");

assert(
  isPathAllowedForAuditor("/governance/compliance/evidence-freshness"),
  "auditor can open evidence freshness page",
);

console.log("test-evidence-freshness: all checks passed");
