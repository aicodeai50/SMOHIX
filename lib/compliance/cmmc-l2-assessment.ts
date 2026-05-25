import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildCmmcFamilyReadiness,
  overallSprsFromMonitoring,
  type CmmcFamilyReadiness,
  type CmmcPracticeFamily,
  type SprsPosture,
} from "@/lib/compliance/cmmc-l2-sprs";
import {
  buildContinuousAssessmentReport,
  type AssessmentException,
  type ControlMonitoringRow,
  type ControlTrend,
  type ContinuousAssessmentReport,
} from "@/lib/compliance/continuous-assessment";

export type { ControlTrend, CmmcFamilyReadiness, CmmcPracticeFamily, SprsPosture };
export type CmmcPracticeMonitoringRow = ControlMonitoringRow;
export type CmmcL2AssessmentException = AssessmentException;
export type CmmcL2AssessmentReport = ContinuousAssessmentReport & {
  framework: "cmmc_l2";
  sprsScore: number;
  sprsBand: string;
  sprsBandDescription: string;
  familyReadiness: CmmcFamilyReadiness[];
};

export async function buildCmmcL2AssessmentReport(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<CmmcL2AssessmentReport | null> {
  const report = await buildContinuousAssessmentReport(userId, {
    ...opts,
    framework: "cmmc_l2",
  });
  if (!report || report.framework !== "cmmc_l2") return null;

  const familyReadiness = buildCmmcFamilyReadiness(report.controlMonitoring);
  const sprs = overallSprsFromMonitoring(report.controlMonitoring);

  return {
    ...report,
    framework: "cmmc_l2",
    readinessPercent: sprs.readinessPercent,
    sprsScore: sprs.sprsScore,
    sprsBand: sprs.sprsBand,
    sprsBandDescription: sprs.sprsBandDescription,
    familyReadiness,
  };
}
