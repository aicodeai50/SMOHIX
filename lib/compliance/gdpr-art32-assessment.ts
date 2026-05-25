import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildGdprArt32DomainReadiness,
  dpaPostureFromMonitoring,
  type DpaReadinessPosture,
  type GdprArt32DomainReadiness,
  type GdprArt32MeasureDomain,
} from "@/lib/compliance/gdpr-art32-readiness";
import {
  buildContinuousAssessmentReport,
  type AssessmentException,
  type ControlMonitoringRow,
  type ControlTrend,
  type ContinuousAssessmentReport,
} from "@/lib/compliance/continuous-assessment";

export type { ControlTrend, DpaReadinessPosture, GdprArt32DomainReadiness, GdprArt32MeasureDomain };
export type GdprArt32MeasureMonitoringRow = ControlMonitoringRow;
export type GdprArt32AssessmentException = AssessmentException;
export type GdprArt32AssessmentReport = ContinuousAssessmentReport & {
  framework: "gdpr_art32";
  dpaReadinessPercent: number;
  dpaBand: string;
  dpaBandDescription: string;
  domainReadiness: GdprArt32DomainReadiness[];
};

export async function buildGdprArt32AssessmentReport(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<GdprArt32AssessmentReport | null> {
  const report = await buildContinuousAssessmentReport(userId, {
    ...opts,
    framework: "gdpr_art32",
  });
  if (!report || report.framework !== "gdpr_art32") return null;

  const domainReadiness = buildGdprArt32DomainReadiness(report.controlMonitoring);
  const dpa = dpaPostureFromMonitoring(report.controlMonitoring);

  return {
    ...report,
    framework: "gdpr_art32",
    readinessPercent: dpa.dpaReadinessPercent,
    dpaReadinessPercent: dpa.dpaReadinessPercent,
    dpaBand: dpa.dpaBand,
    dpaBandDescription: dpa.dpaBandDescription,
    domainReadiness,
  };
}
