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
export type HipaaControlMonitoringRow = ControlMonitoringRow;
export type HipaaAssessmentException = AssessmentException;
export type HipaaSecurityAssessmentReport = ContinuousAssessmentReport & {
  framework: "hipaa";
};

export async function buildHipaaSecurityAssessmentReport(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<HipaaSecurityAssessmentReport | null> {
  const report = await buildContinuousAssessmentReport(userId, {
    ...opts,
    framework: "hipaa",
  });
  if (!report || report.framework !== "hipaa") return null;
  return report as HipaaSecurityAssessmentReport;
}
