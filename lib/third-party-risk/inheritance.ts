import { inheritBaaHipaaControlIds } from "@/lib/third-party-risk/baa-inheritance";
import type { VendorCategory, VendorRiskTier, VendorStatus } from "@/lib/third-party-risk/types";

const TIER_BASE: Record<VendorRiskTier, readonly string[]> = {
  low: ["soc2:CC1.2", "iso:A.5.23"],
  medium: ["soc2:CC5.3", "soc2:CC6.1", "iso:A.5.23", "iso:A.8.9"],
  high: [
    "soc2:CC5.3",
    "soc2:CC6.1",
    "soc2:CC6.6",
    "soc2:CC7.2",
    "iso:A.5.15",
    "iso:A.5.23",
    "iso:A.8.2",
    "iso:A.8.9",
  ],
  critical: [
    "soc2:CC5.3",
    "soc2:CC6.1",
    "soc2:CC6.6",
    "soc2:CC7.2",
    "soc2:CC7.3",
    "soc2:CC7.4",
    "soc2:CC8.1",
    "iso:A.5.15",
    "iso:A.5.23",
    "iso:A.5.24",
    "iso:A.8.2",
    "iso:A.8.9",
    "iso:A.8.16",
  ],
};

const CATEGORY_BOOST: Record<VendorCategory, readonly string[]> = {
  saas: ["soc2:CC6.6", "iso:A.8.25"],
  cloud: ["soc2:CC6.6", "iso:A.5.23", "iso:A.8.9"],
  security: ["soc2:CC7.2", "soc2:CC7.3", "iso:A.8.16"],
  data_processor: [
    "soc2:CC1.2",
    "soc2:CC1.4",
    "iso:A.5.24",
    "pcidss:3.2.1",
    "pcidss:4.2.1",
    "hipaa:164.308b1",
    "hipaa:164.312e1",
  ],
  consulting: ["soc2:CC1.4", "soc2:CC5.3"],
  healthcare_baa: [],
  other: [],
};

/** Inherit representative SOC 2 / ISO controls from vendor risk tier and category. */
export function inheritControlIdsForVendor(
  riskTier: VendorRiskTier,
  category: VendorCategory,
): string[] {
  if (category === "healthcare_baa") {
    const baa = inheritBaaHipaaControlIds();
    const ids = new Set<string>([...baa, ...TIER_BASE[riskTier]]);
    return [...ids].sort();
  }
  const ids = new Set<string>([...TIER_BASE[riskTier], ...CATEGORY_BOOST[category]]);
  return [...ids].sort();
}

export function isVendorRiskTier(value: string): value is VendorRiskTier {
  return value === "low" || value === "medium" || value === "high" || value === "critical";
}

export function isVendorCategory(value: string): value is VendorCategory {
  return (
    value === "saas" ||
    value === "cloud" ||
    value === "security" ||
    value === "data_processor" ||
    value === "consulting" ||
    value === "healthcare_baa" ||
    value === "other"
  );
}

export function isVendorStatus(value: string): value is VendorStatus {
  return value === "active" || value === "review" || value === "offboarding";
}
