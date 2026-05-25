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
export type IsoControlMonitoringRow = ControlMonitoringRow;
export type IsoAssessmentException = AssessmentException;
export type Iso27001AssessmentReport = ContinuousAssessmentReport & {
  framework: "iso27001";
};

export async function buildIso27001AssessmentReport(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<Iso27001AssessmentReport | null> {
  const report = await buildContinuousAssessmentReport(userId, {
    ...opts,
    framework: "iso27001",
  });
  if (!report || report.framework !== "iso27001") return null;
  return report as Iso27001AssessmentReport;
}
