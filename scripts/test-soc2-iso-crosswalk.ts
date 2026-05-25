import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import {
  buildSoc2IsoCrosswalkMatrix,
  SOC2_ISO_CROSSWALK_LINKS,
  soc2IsoCrosswalkToCsv,
} from "../lib/compliance/soc2-iso-crosswalk";
import type { ComplianceSummary } from "../lib/compliance/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const soc2 = COMPLIANCE_CONTROLS.filter((c) => c.framework === "soc2");
const iso = COMPLIANCE_CONTROLS.filter((c) => c.framework === "iso27001");
assert(soc2.length === 9, "nine SOC 2 controls in catalog");
assert(iso.length === 7, "seven ISO Annex A controls in catalog");
assert(SOC2_ISO_CROSSWALK_LINKS.length >= 10, "at least ten crosswalk links");

for (const link of SOC2_ISO_CROSSWALK_LINKS) {
  assert(
    COMPLIANCE_CONTROLS.some((c) => c.id === link.soc2Id),
    `soc2 id exists: ${link.soc2Id}`,
  );
  assert(
    COMPLIANCE_CONTROLS.some((c) => c.id === link.isoId),
    `iso id exists: ${link.isoId}`,
  );
}

const empty: ComplianceSummary = {
  sinceIso: new Date().toISOString(),
  auditEventsScanned: 0,
  acceptedPolicyCount: 0,
  coveragePercent: 0,
  rows: COMPLIANCE_CONTROLS.map((control) => ({
    control,
    auditEvidenceCount: 0,
    policyEvidenceCount: 0,
    status: "none" as const,
  })),
};

const matrix = buildSoc2IsoCrosswalkMatrix(empty.rows);
assert(matrix.length === SOC2_ISO_CROSSWALK_LINKS.length, "matrix row per link");

const csv = soc2IsoCrosswalkToCsv({
  generatedAt: new Date().toISOString(),
  periodDays: 30,
  sinceIso: empty.sinceIso,
  soc2ControlCount: soc2.length,
  isoControlCount: iso.length,
  linkCount: matrix.length,
  rows: matrix,
});
assert(csv.includes("soc2_ref"), "csv has soc2 column");
assert(csv.includes("iso_ref"), "csv has iso column");
assert(csv.includes("CC6.1"), "csv includes soc2 ref");

assert(isPathAllowedForAuditor("/governance/compliance/crosswalk"), "auditor can open crosswalk page");

console.log("test-soc2-iso-crosswalk: all checks passed");
