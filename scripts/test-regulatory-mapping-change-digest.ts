import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import {
  buildCurrentMappingSnapshot,
  computeMappingChanges,
  crosswalkKey,
  buildRegulatoryMappingDigestPayload,
} from "../lib/compliance/regulatory-mapping-change-digest";
import { SOC2_ISO_CROSSWALK_LINKS } from "../lib/compliance/soc2-iso-crosswalk";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const current = buildCurrentMappingSnapshot();
assert(current.controlIds.length === COMPLIANCE_CONTROLS.length, "control count");
assert(current.crosswalkKeys.length === SOC2_ISO_CROSSWALK_LINKS.length, "crosswalk count");

const baseline = computeMappingChanges(null, current);
assert(baseline.baseline && baseline.changeCount === 0, "baseline");

const previous: typeof current = {
  ...current,
  controlIds: current.controlIds.slice(0, -1),
  crosswalkKeys: current.crosswalkKeys.slice(0, -1),
};

const deltas = computeMappingChanges(previous, current);
assert(deltas.changeCount >= 2, "detects control and crosswalk deltas");

const key = crosswalkKey("soc2:CC6.1", "iso:A.5.15", "primary");
assert(key.includes("::"), "crosswalk key format");

const payload = buildRegulatoryMappingDigestPayload("org-1", current, deltas, "https://zentro.run");
assert(payload.type === "zentro.regulatory_mapping_digest", "payload type");
assert(payload.crosswalkUrl.includes("/crosswalk"), "crosswalk url");

assert(isPathAllowedForAuditor("/governance/compliance/mapping-digest"), "auditor path");

console.log("test-regulatory-mapping-change-digest: all checks passed");
