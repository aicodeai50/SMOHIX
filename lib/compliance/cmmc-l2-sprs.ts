import type { ControlMonitoringRow } from "@/lib/compliance/continuous-assessment";

/** NIST 800-171 family labels used as CMMC L2 practice groupings. */
export type CmmcPracticeFamily =
  | "AC"
  | "AU"
  | "CM"
  | "IA"
  | "IR"
  | "RA"
  | "SC"
  | "SI";

export const CMMC_FAMILY_LABELS: Record<CmmcPracticeFamily, string> = {
  AC: "Access Control (AC)",
  AU: "Audit & Accountability (AU)",
  CM: "Configuration Management (CM)",
  IA: "Identification & Authentication (IA)",
  IR: "Incident Response (IR)",
  RA: "Risk Assessment (RA)",
  SC: "System & Communications Protection (SC)",
  SI: "System & Information Integrity (SI)",
};

export type CmmcFamilyReadiness = {
  family: CmmcPracticeFamily;
  familyLabel: string;
  readinessPercent: number;
  practiceCount: number;
  covered: number;
  partial: number;
  none: number;
};

export type SprsPosture = {
  /** Estimated SPRS score (0–110) from evidence-weighted practice implementation. */
  sprsScore: number;
  sprsBand: string;
  sprsBandDescription: string;
};

export function sprsScoreFromReadiness(readinessPercent: number): number {
  const clamped = Math.max(0, Math.min(100, readinessPercent));
  return Math.round((clamped / 100) * 110);
}

export function sprsPostureFromScore(score: number): SprsPosture {
  const sprsScore = Math.max(0, Math.min(110, Math.round(score)));
  if (sprsScore >= 90) {
    return {
      sprsScore,
      sprsBand: "Strong",
      sprsBandDescription: "Evidence supports a high SPRS-style posture for Level 2 practices.",
    };
  }
  if (sprsScore >= 70) {
    return {
      sprsScore,
      sprsBand: "Adequate",
      sprsBandDescription: "Majority of practices show audit or policy evidence in the monitoring window.",
    };
  }
  if (sprsScore >= 50) {
    return {
      sprsScore,
      sprsBand: "Developing",
      sprsBandDescription: "Partial implementation — prioritize gaps before assessment.",
    };
  }
  return {
    sprsScore,
    sprsBand: "At risk",
    sprsBandDescription: "Limited evidence across 800-171 practices; SPRS-style score reflects material gaps.",
  };
}

export function buildCmmcFamilyReadiness(monitoring: ControlMonitoringRow[]): CmmcFamilyReadiness[] {
  const byFamily = new Map<string, ControlMonitoringRow[]>();
  for (const row of monitoring) {
    const list = byFamily.get(row.domain) ?? [];
    list.push(row);
    byFamily.set(row.domain, list);
  }

  const order: CmmcPracticeFamily[] = ["AC", "IA", "AU", "CM", "IR", "RA", "SC", "SI"];
  const results: CmmcFamilyReadiness[] = [];

  for (const family of order) {
    const rows = byFamily.get(family);
    if (!rows?.length) continue;
    const covered = rows.filter((r) => r.currentStatus === "covered").length;
    const partial = rows.filter((r) => r.currentStatus === "partial").length;
    const none = rows.filter((r) => r.currentStatus === "none").length;
    const total = rows.length;
    const readinessPercent =
      total > 0 ? Math.round(((covered + partial * 0.5) / total) * 1000) / 10 : 0;
    results.push({
      family,
      familyLabel: CMMC_FAMILY_LABELS[family],
      readinessPercent,
      practiceCount: total,
      covered,
      partial,
      none,
    });
  }

  return results;
}

export function overallSprsFromMonitoring(monitoring: ControlMonitoringRow[]): SprsPosture & {
  readinessPercent: number;
} {
  if (monitoring.length === 0) {
    const posture = sprsPostureFromScore(0);
    return { ...posture, readinessPercent: 0 };
  }
  const covered = monitoring.filter((r) => r.currentStatus === "covered").length;
  const partial = monitoring.filter((r) => r.currentStatus === "partial").length;
  const total = monitoring.length;
  const readinessPercent = Math.round(((covered + partial * 0.5) / total) * 1000) / 10;
  const posture = sprsPostureFromScore(sprsScoreFromReadiness(readinessPercent));
  return { ...posture, readinessPercent };
}
