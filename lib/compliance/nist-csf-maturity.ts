import type { ControlMonitoringRow } from "@/lib/compliance/continuous-assessment";

export type NistCsfMaturityTier = 1 | 2 | 3 | 4;

export const NIST_CSF_TIER_LABELS: Record<NistCsfMaturityTier, string> = {
  1: "Tier 1 — Partial",
  2: "Tier 2 — Risk informed",
  3: "Tier 3 — Repeatable",
  4: "Tier 4 — Adaptive",
};

/** Map evidence readiness percent to NIST CSF implementation tier (1–4). */
export function maturityTierFromReadiness(readinessPercent: number): NistCsfMaturityTier {
  if (readinessPercent >= 75) return 4;
  if (readinessPercent >= 50) return 3;
  if (readinessPercent >= 25) return 2;
  return 1;
}

export type NistCsfFunctionMaturity = {
  function: string;
  tier: NistCsfMaturityTier;
  tierLabel: string;
  readinessPercent: number;
  controlCount: number;
  covered: number;
  partial: number;
  none: number;
};

export function buildNistCsfFunctionMaturity(
  monitoring: ControlMonitoringRow[],
): NistCsfFunctionMaturity[] {
  const byFunction = new Map<string, ControlMonitoringRow[]>();
  for (const row of monitoring) {
    const list = byFunction.get(row.domain) ?? [];
    list.push(row);
    byFunction.set(row.domain, list);
  }

  const order = ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"];
  const results: NistCsfFunctionMaturity[] = [];

  for (const fn of order) {
    const rows = byFunction.get(fn);
    if (!rows?.length) continue;
    const covered = rows.filter((r) => r.currentStatus === "covered").length;
    const partial = rows.filter((r) => r.currentStatus === "partial").length;
    const none = rows.filter((r) => r.currentStatus === "none").length;
    const total = rows.length;
    const readinessPercent =
      total > 0 ? Math.round(((covered + partial * 0.5) / total) * 1000) / 10 : 0;
    const tier = maturityTierFromReadiness(readinessPercent);
    results.push({
      function: fn,
      tier,
      tierLabel: NIST_CSF_TIER_LABELS[tier],
      readinessPercent,
      controlCount: total,
      covered,
      partial,
      none,
    });
  }

  return results;
}

export function overallMaturityFromFunctions(
  functions: NistCsfFunctionMaturity[],
): { tier: NistCsfMaturityTier; tierLabel: string; readinessPercent: number } {
  if (functions.length === 0) {
    return { tier: 1, tierLabel: NIST_CSF_TIER_LABELS[1], readinessPercent: 0 };
  }
  const readinessPercent =
    Math.round(
      (functions.reduce((s, f) => s + f.readinessPercent, 0) / functions.length) * 10,
    ) / 10;
  const tier = maturityTierFromReadiness(readinessPercent);
  return { tier, tierLabel: NIST_CSF_TIER_LABELS[tier], readinessPercent };
}
