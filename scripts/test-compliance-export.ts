import { complianceEvidencePackToCsv } from "../lib/compliance/export";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const mockPack = {
  generatedAt: "2026-05-24T12:00:00.000Z",
  windowLabel: "30d",
  sinceIso: "2026-04-24T00:00:00.000Z",
  summary: {
    sinceIso: "2026-04-24T00:00:00.000Z",
    auditEventsScanned: 2,
    acceptedPolicyCount: 1,
    coveragePercent: 50,
    rows: [],
  },
  auditEvents: [
    {
      createdAt: "2026-05-20T10:00:00.000Z",
      eventType: "approval.approved",
      actor: "account" as const,
      incidentId: "",
      soc2Controls: ["CC8.1"],
      iso27001Controls: ["A.8.9"],
      pciDssControls: ["12.3.1"],
      hipaaControls: ["164.312b"],
      nistCsfControls: ["RS.MA-01"],
      cisV8Controls: ["17.1"],
      cmmcL2Controls: ["3.6.1"],
      gdprArt32Controls: ["32-r1"],
      detailsJson: '{"playbook_id":"pb-1"}',
    },
  ],
  acceptedPolicies: [
    {
      playbookId: "pb-restart",
      requireDryRunFresh: true,
      requireChangeWindow: true,
      maxBlastRadius: "service",
      soc2Controls: ["CC8.1"],
      iso27001Controls: ["A.8.25"],
      pciDssControls: ["6.3.1"],
      hipaaControls: ["164.308a6"],
      nistCsfControls: ["GV.PO-01"],
      cisV8Controls: ["4.1"],
      cmmcL2Controls: ["3.4.1"],
      gdprArt32Controls: ["32-i1"],
    },
  ],
};

const csv = complianceEvidencePackToCsv(mockPack);
assert(csv.includes("CC8.1"), "csv includes soc2 control refs");
assert(csv.includes("accepted_policies"), "csv includes policy section");
assert(csv.includes("coverage_percent"), "csv includes metadata header");
assert(csv.includes("pci_dss_controls"), "csv includes pci column header");
assert(csv.includes("nist_csf_controls"), "csv includes nist csf column header");
assert(csv.includes("cis_v8_controls"), "csv includes cis v8 column header");
assert(csv.includes("cmmc_l2_controls"), "csv includes cmmc l2 column header");
assert(csv.includes("gdpr_art32_controls"), "csv includes gdpr art32 column header");

console.log("test-compliance-export: all checks passed");
