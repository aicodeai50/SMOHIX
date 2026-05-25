import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import {
  buildFedrampPoamRows,
  CATALOG_NIST_800_53_LINKS,
  catalogIdForFrameworkRef,
  fedrampPoamToCsv,
  FEDRAMP_POAM_VERSION,
  riskRatingForWeakness,
  validateCatalogNistLinks,
  type FedrampPoamGapSource,
} from "../lib/compliance/fedramp-poam";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const linkCheck = validateCatalogNistLinks();
assert(linkCheck.ok, `all catalog nist links exist: ${!linkCheck.ok ? linkCheck.missing.join(", ") : ""}`);
assert(CATALOG_NIST_800_53_LINKS.length >= 20, "at least twenty NIST crosswalk links");

assert(catalogIdForFrameworkRef("soc2", "CC6.1") === "soc2:CC6.1", "soc2 catalog id");
assert(catalogIdForFrameworkRef("iso27001", "A.5.15") === "iso:A.5.15", "iso catalog id");
assert(catalogIdForFrameworkRef("cmmc_l2", "3.1.1") === "cmmc_l2:3.1.1", "cmmc catalog id");

assert(riskRatingForWeakness("No audit or policy evidence") === "High", "none maps to high");
assert(riskRatingForWeakness("Partial evidence") === "Moderate", "partial maps to moderate");
assert(riskRatingForWeakness("Control posture regressed") === "Moderate", "regressed maps to moderate");

const gaps: FedrampPoamGapSource[] = [
  {
    framework: "soc2",
    controlRef: "CC6.1",
    controlTitle: "Logical access security",
    domain: "Logical access",
    reason: "No audit or policy evidence in the current monitoring window.",
  },
  {
    framework: "iso27001",
    controlRef: "A.5.15",
    controlTitle: "Access control",
    domain: "Organizational",
    reason: "Partial evidence — missing audit events or accepted policy mapping.",
  },
  {
    framework: "cmmc_l2",
    controlRef: "3.1.1",
    controlTitle: "Limit system access",
    domain: "AC",
    reason: "Control posture regressed versus the prior monitoring window.",
  },
];

const { rows, unmappedGapCount } = buildFedrampPoamRows(gaps);
assert(unmappedGapCount === 0, "sample gaps all map");
assert(rows.length === 2, "AC-2 and AC-3 merge to two nist rows (AC-2 from soc2+cmmc may merge)");
// soc2 CC6.1 and cmmc 3.1.1 both map to AC-2 -> one row
assert(rows.some((r) => r.nistControlId === "AC-2"), "AC-2 poam row");
assert(rows.some((r) => r.nistControlId === "AC-3"), "AC-3 poam row");

const csv = fedrampPoamToCsv({
  version: FEDRAMP_POAM_VERSION,
  generatedAt: new Date().toISOString(),
  periodDays: 30,
  sinceIso: new Date().toISOString(),
  orgId: "org-test",
  deploymentTier: "fedramp_ready",
  dataRegion: "us-gov-east-1",
  dataBoundary: "gov_cloud",
  sourceFrameworks: ["soc2", "iso27001", "cmmc_l2"],
  gapSourceCount: gaps.length,
  poamRowCount: rows.length,
  unmappedGapCount: 0,
  rows,
});
assert(csv.includes("poam_id"), "csv header");
assert(csv.includes("AC-2"), "csv includes nist control");

const soc2Count = COMPLIANCE_CONTROLS.filter((c) => c.framework === "soc2").length;
assert(soc2Count === 9, "nine SOC 2 controls in catalog");

assert(isPathAllowedForAuditor("/governance/compliance/fedramp-poam"), "auditor can open POA&M page");

console.log("test-fedramp-poam: all checks passed");
