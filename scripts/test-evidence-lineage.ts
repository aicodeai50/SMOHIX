import type { ComplianceEvidenceAuditRow } from "../lib/compliance/export";
import type { EvidenceBundleRow } from "../lib/compliance/evidence-bundle";
import {
  auditRowTouchesControl,
  buildAuditSourcesByControl,
  buildControlEvidenceTrails,
  buildEvidenceLineagePackFromParts,
  buildLineagePipeline,
  bundleOverlapsPeriod,
  countAuditEventsByType,
  controlsInBundlePack,
} from "../lib/compliance/evidence-lineage";
import { isPathAllowedForAuditor } from "../lib/org/auditor-workspace";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const auditRow: ComplianceEvidenceAuditRow = {
  createdAt: new Date().toISOString(),
  eventType: "governance.compliance_exported",
  actor: "account",
  incidentId: "",
  soc2Controls: ["CC1.2"],
  iso27001Controls: [],
  pciDssControls: [],
  hipaaControls: [],
  nistCsfControls: [],
  cisV8Controls: [],
  cmmcL2Controls: [],
  gdprArt32Controls: [],
  detailsJson: "",
};

assert(auditRowTouchesControl(auditRow, "soc2", "CC1.2"), "audit row touches soc2 CC1.2");

const counts = countAuditEventsByType([
  { event_type: "governance.compliance_exported" },
  { event_type: "governance.compliance_exported" },
]);
assert(counts.get("governance.compliance_exported") === 2, "event type counts");

const auditByControl = buildAuditSourcesByControl(counts);
assert((auditByControl.get("soc2:CC1.2")?.length ?? 0) > 0, "audit mapped to control");

const sinceIso = new Date(Date.now() - 30 * 86_400_000).toISOString();
const bundle = {
  id: "bundle-1",
  orgId: "org-1",
  windowLabel: "30d",
  sinceIso,
  manifestSha256: "abc",
  manifest: {
    version: "smohix-evidence-bundle/1",
    bundleId: "bundle-1",
    orgId: "org-1",
    generatedAt: new Date().toISOString(),
    windowLabel: "30d",
    sinceIso,
    coveragePercent: 50,
    auditEventCount: 1,
    acceptedPolicyCount: 0,
    files: [],
    manifestSha256: "abc",
  },
  storageUri: "smohix://x",
  deliveryStatus: "stored",
  deliveryNote: null,
  createdAt: new Date().toISOString(),
  createdBy: "user-1",
} satisfies EvidenceBundleRow;

assert(bundleOverlapsPeriod(bundle, sinceIso), "bundle overlaps period");

const inBundle = controlsInBundlePack([auditRow], [], {});
assert(inBundle.has("soc2:CC1.2"), "control in bundle pack");

const trails = buildControlEvidenceTrails({
  coverageRows: [
    {
      control: {
        id: "soc2:CC1.2",
        framework: "soc2",
        ref: "CC1.2",
        title: "Board oversight",
      },
      status: "covered",
      auditEvidenceCount: 2,
      policyEvidenceCount: 0,
    },
  ],
  auditByControl,
  policyByControl: new Map(),
  bundles: [bundle],
  sinceIso,
  controlsInLatestBundle: inBundle,
  assessorWorkbookExported: true,
});

assert(trails.length === 1, "one trail");
assert(trails[0].inAssessorWorkbook, "workbook flag when exported");

const pipeline = buildLineagePipeline({
  auditEventsScanned: 2,
  acceptedPolicyCount: 0,
  mappedControlCount: 1,
  bundleCount: 1,
  assessorWorkbookExported: true,
  latestBundleAuditEvents: 1,
});
assert(pipeline.length === 6, "six pipeline stages");

const pack = buildEvidenceLineagePackFromParts({
  orgId: "org-1",
  periodDays: 30,
  sinceIso,
  auditEventsScanned: 2,
  acceptedPolicyCount: 0,
  bundles: [bundle],
  trails,
  assessorWorkbookExported: true,
  latestBundleAuditEvents: 1,
});
assert(pack.hubControlIds.length > 0, "hub controls");

assert(
  isPathAllowedForAuditor("/governance/compliance/evidence-lineage"),
  "auditor can open evidence lineage",
);

console.log("test-evidence-lineage: all checks passed");
