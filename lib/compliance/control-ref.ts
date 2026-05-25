import type { ComplianceControlRef, ComplianceFramework } from "@/lib/compliance/types";

export function complianceControlRefFromId(id: string): ComplianceControlRef {
  const colon = id.indexOf(":");
  if (colon < 0) {
    return { id, framework: "soc2", ref: id };
  }
  return {
    id,
    framework: id.slice(0, colon) as ComplianceFramework,
    ref: id.slice(colon + 1),
  };
}
