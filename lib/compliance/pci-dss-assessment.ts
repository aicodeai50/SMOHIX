import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildContinuousAssessmentReport,
  type AssessmentException,
  type ControlMonitoringRow,
  type ControlTrend,
  type ContinuousAssessmentReport,
  type DomainAssessmentSummary,
} from "@/lib/compliance/continuous-assessment";

export type { ControlTrend, DomainAssessmentSummary };
export type PciControlMonitoringRow = ControlMonitoringRow;
export type PciDssAssessmentException = AssessmentException;
export type PciDssAssessmentReport = ContinuousAssessmentReport & {
  framework: "pcidss";
};

export async function buildPciDssAssessmentReport(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<PciDssAssessmentReport | null> {
  const report = await buildContinuousAssessmentReport(userId, {
    ...opts,
    framework: "pcidss",
  });
  if (!report || report.framework !== "pcidss") return null;
  return report as PciDssAssessmentReport;
}
