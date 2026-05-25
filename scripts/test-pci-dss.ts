import { COMPLIANCE_CONTROLS } from "../lib/compliance/catalog";
import { buildControlMonitoringForFramework } from "../lib/compliance/continuous-assessment";
import { complianceControlsForAuditEvent } from "../lib/compliance/map-audit";
import type { ComplianceSummary } from "../lib/compliance/types";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const pciControls = COMPLIANCE_CONTROLS.filter((c) => c.framework === "pcidss");
assert(pciControls.length === 11, "eleven PCI DSS controls in catalog");
assert(pciControls.every((c) => c.id.startsWith("pcidss:")), "PCI ids use pcidss prefix");

const empty: ComplianceSummary = {
  sinceIso: new Date().toISOString(),
  auditEventsScanned: 0,
  acceptedPolicyCount: 0,
  coveragePercent: 0,
  rows: [],
};
const monitoring = buildControlMonitoringForFramework("pcidss", empty, empty);
assert(monitoring.length === pciControls.length, "monitoring covers all PCI controls");

const apiKey = complianceControlsForAuditEvent("api_key.created");
assert(apiKey.some((c) => c.framework === "pcidss" && c.ref === "7.2.1"), "api keys map to PCI access control");

assert(isPathAllowedForAuditor("/governance/compliance/pci-dss"), "auditor can open PCI DSS page");

console.log("test-pci-dss: all checks passed");
