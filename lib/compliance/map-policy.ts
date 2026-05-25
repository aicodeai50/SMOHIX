import type { AcceptedPolicyGuardrails } from "@/lib/approvals/policy-suggestions";
import { complianceControlRefFromId } from "@/lib/compliance/control-ref";
import type { ComplianceControlRef } from "@/lib/compliance/types";

function refs(ids: string[]): ComplianceControlRef[] {
  return ids.map(complianceControlRefFromId);
}

export function complianceControlsForAcceptedPolicy(
  guardrails: AcceptedPolicyGuardrails,
): ComplianceControlRef[] {
  const ids = new Set<string>([
    "soc2:CC5.3",
    "iso:A.8.9",
    "pcidss:12.3.1",
    "hipaa:164.308a1",
    "nist_csf:GV.PO-01",
    "nist_csf:GV.OC-01",
    "cis_v8:4.1",
    "cis_v8:6.1",
    "cmmc_l2:3.1.1",
    "cmmc_l2:3.4.1",
    "gdpr_art32:32-b1",
    "gdpr_art32:32-i1",
  ]);
  if (guardrails.requireDryRunFresh) {
    ids.add("soc2:CC8.1");
    ids.add("iso:A.8.25");
    ids.add("pcidss:6.3.1");
    ids.add("cis_v8:7.1");
    ids.add("cmmc_l2:3.11.2");
    ids.add("gdpr_art32:32-d1");
  }
  if (guardrails.requireChangeWindow) {
    ids.add("soc2:CC8.1");
    ids.add("iso:A.8.9");
    ids.add("pcidss:12.3.1");
  }
  if (guardrails.maxBlastRadius) {
    ids.add("soc2:CC7.2");
    ids.add("iso:A.8.16");
    ids.add("pcidss:11.5.1");
    ids.add("hipaa:164.312b");
  }
  if (guardrails.playbookId) {
    ids.add("soc2:CC7.3");
    ids.add("pcidss:10.2.1");
    ids.add("hipaa:164.308a6");
    ids.add("nist_csf:DE.CM-01");
    ids.add("nist_csf:DE.AE-01");
    ids.add("cis_v8:8.2");
    ids.add("cis_v8:6.3");
    ids.add("cmmc_l2:3.3.1");
    ids.add("cmmc_l2:3.3.2");
    ids.add("gdpr_art32:32-v1");
    ids.add("gdpr_art32:32-v2");
  }
  return refs([...ids]);
}

export function complianceControlsForPolicySuggestion(guardrails: string[]): ComplianceControlRef[] {
  const ids = new Set<string>(["soc2:CC5.3"]);
  const text = guardrails.join(" ").toLowerCase();
  if (text.includes("dry-run") || text.includes("dry run")) {
    ids.add("soc2:CC8.1");
    ids.add("iso:A.8.25");
  }
  if (text.includes("change window")) {
    ids.add("soc2:CC8.1");
  }
  if (text.includes("blast")) {
    ids.add("soc2:CC7.2");
  }
  return refs([...ids]);
}
