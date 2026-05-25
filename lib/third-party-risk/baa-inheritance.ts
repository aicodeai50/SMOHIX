import { COMPLIANCE_CONTROLS } from "@/lib/compliance/catalog";

/** HIPAA Security Rule controls inherited for healthcare BAA vendors. */
export function inheritBaaHipaaControlIds(): string[] {
  return COMPLIANCE_CONTROLS.filter((c) => c.framework === "hipaa")
    .map((c) => c.id)
    .sort();
}
