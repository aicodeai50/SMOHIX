import type { ControlMonitoringRow } from "@/lib/compliance/continuous-assessment";

export type CisImplementationGroup = "IG1" | "IG2" | "IG3";

export const CIS_IG_LABELS: Record<CisImplementationGroup, string> = {
  IG1: "IG1 — Essential cyber hygiene",
  IG2: "IG2 — Enterprise safeguards",
  IG3: "IG3 — High-sensitivity environments",
};

export type CisIgReadiness = {
  implementationGroup: CisImplementationGroup;
  groupLabel: string;
  readinessPercent: number;
  safeguardCount: number;
  covered: number;
  partial: number;
  none: number;
};

export function buildCisIgReadiness(monitoring: ControlMonitoringRow[]): CisIgReadiness[] {
  const byIg = new Map<string, ControlMonitoringRow[]>();
  for (const row of monitoring) {
    const list = byIg.get(row.domain) ?? [];
    list.push(row);
    byIg.set(row.domain, list);
  }

  const order: CisImplementationGroup[] = ["IG1", "IG2", "IG3"];
  const results: CisIgReadiness[] = [];

  for (const ig of order) {
    const rows = byIg.get(ig);
    if (!rows?.length) continue;
    const covered = rows.filter((r) => r.currentStatus === "covered").length;
    const partial = rows.filter((r) => r.currentStatus === "partial").length;
    const none = rows.filter((r) => r.currentStatus === "none").length;
    const total = rows.length;
    const readinessPercent =
      total > 0 ? Math.round(((covered + partial * 0.5) / total) * 1000) / 10 : 0;
    results.push({
      implementationGroup: ig,
      groupLabel: CIS_IG_LABELS[ig],
      readinessPercent,
      safeguardCount: total,
      covered,
      partial,
      none,
    });
  }

  return results;
}

/** Highest IG whose readiness meets the 75% evidence threshold (else lowest IG). */
export function overallIgPostureFromGroups(groups: CisIgReadiness[]): {
  attainedIg: CisImplementationGroup;
  attainedLabel: string;
  readinessPercent: number;
} {
  if (groups.length === 0) {
    return { attainedIg: "IG1", attainedLabel: CIS_IG_LABELS.IG1, readinessPercent: 0 };
  }

  const threshold = 75;
  let attained: CisImplementationGroup = "IG1";
  for (const g of groups) {
    if (g.readinessPercent >= threshold) {
      attained = g.implementationGroup;
    }
  }

  const row = groups.find((g) => g.implementationGroup === attained) ?? groups[0];
  return {
    attainedIg: attained,
    attainedLabel: CIS_IG_LABELS[attained],
    readinessPercent: row.readinessPercent,
  };
}
