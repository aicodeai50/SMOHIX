import type { ControlMonitoringRow } from "@/lib/compliance/continuous-assessment";

/** Article 32(1) measure groupings for DPA-oriented readiness rollups. */
export type GdprArt32MeasureDomain =
  | "Encryption"
  | "Confidentiality"
  | "Integrity"
  | "Availability"
  | "Resilience"
  | "Assurance";

export const GDPR_ART32_DOMAIN_LABELS: Record<GdprArt32MeasureDomain, string> = {
  Encryption: "Encryption & pseudonymisation",
  Confidentiality: "Confidentiality of processing",
  Integrity: "Integrity of processing",
  Availability: "Availability of processing",
  Resilience: "Resilience & recovery",
  Assurance: "Testing & evaluation",
};

export type GdprArt32DomainReadiness = {
  domain: GdprArt32MeasureDomain;
  domainLabel: string;
  readinessPercent: number;
  measureCount: number;
  covered: number;
  partial: number;
  none: number;
};

export type DpaReadinessPosture = {
  dpaReadinessPercent: number;
  dpaBand: string;
  dpaBandDescription: string;
};

export function buildGdprArt32DomainReadiness(
  monitoring: ControlMonitoringRow[],
): GdprArt32DomainReadiness[] {
  const byDomain = new Map<string, ControlMonitoringRow[]>();
  for (const row of monitoring) {
    const list = byDomain.get(row.domain) ?? [];
    list.push(row);
    byDomain.set(row.domain, list);
  }

  const order: GdprArt32MeasureDomain[] = [
    "Encryption",
    "Confidentiality",
    "Integrity",
    "Availability",
    "Resilience",
    "Assurance",
  ];
  const results: GdprArt32DomainReadiness[] = [];

  for (const domain of order) {
    const rows = byDomain.get(domain);
    if (!rows?.length) continue;
    const covered = rows.filter((r) => r.currentStatus === "covered").length;
    const partial = rows.filter((r) => r.currentStatus === "partial").length;
    const none = rows.filter((r) => r.currentStatus === "none").length;
    const total = rows.length;
    const readinessPercent =
      total > 0 ? Math.round(((covered + partial * 0.5) / total) * 1000) / 10 : 0;
    results.push({
      domain,
      domainLabel: GDPR_ART32_DOMAIN_LABELS[domain],
      readinessPercent,
      measureCount: total,
      covered,
      partial,
      none,
    });
  }

  return results;
}

export function dpaPostureFromMonitoring(monitoring: ControlMonitoringRow[]): DpaReadinessPosture {
  if (monitoring.length === 0) {
    return {
      dpaReadinessPercent: 0,
      dpaBand: "At risk",
      dpaBandDescription: "No technical measure evidence in the monitoring window.",
    };
  }

  const covered = monitoring.filter((r) => r.currentStatus === "covered").length;
  const partial = monitoring.filter((r) => r.currentStatus === "partial").length;
  const total = monitoring.length;
  const dpaReadinessPercent = Math.round(((covered + partial * 0.5) / total) * 1000) / 10;

  if (dpaReadinessPercent >= 85) {
    return {
      dpaReadinessPercent,
      dpaBand: "DPA-ready",
      dpaBandDescription:
        "Strong Article 32 technical measure evidence suitable for supervisory authority or DPA review packs.",
    };
  }
  if (dpaReadinessPercent >= 65) {
    return {
      dpaReadinessPercent,
      dpaBand: "Substantial",
      dpaBandDescription: "Most security-of-processing measures show audit or policy evidence.",
    };
  }
  if (dpaReadinessPercent >= 40) {
    return {
      dpaReadinessPercent,
      dpaBand: "Developing",
      dpaBandDescription: "Partial implementation — close gaps before formal DPA or customer security questionnaires.",
    };
  }
  return {
    dpaReadinessPercent,
    dpaBand: "At risk",
    dpaBandDescription: "Limited Article 32 evidence; prioritize encryption, resilience, and incident measures.",
  };
}
