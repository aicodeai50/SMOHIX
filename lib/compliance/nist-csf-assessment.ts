import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildContinuousAssessmentReport,
  type AssessmentException,
  type ControlMonitoringRow,
  type ControlTrend,
  type ContinuousAssessmentReport,
} from "@/lib/compliance/continuous-assessment";
import {
  buildNistCsfFunctionMaturity,
  overallMaturityFromFunctions,
  type NistCsfFunctionMaturity,
  type NistCsfMaturityTier,
} from "@/lib/compliance/nist-csf-maturity";

export type { ControlTrend, NistCsfFunctionMaturity, NistCsfMaturityTier };
export type NistCsfControlMonitoringRow = ControlMonitoringRow;
export type NistCsfAlignmentException = AssessmentException;
export type NistCsfAlignmentReport = ContinuousAssessmentReport & {
  framework: "nist_csf";
  overallMaturityTier: NistCsfMaturityTier;
  overallMaturityLabel: string;
  functionMaturity: NistCsfFunctionMaturity[];
};

export async function buildNistCsfAlignmentReport(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<NistCsfAlignmentReport | null> {
  const report = await buildContinuousAssessmentReport(userId, {
    ...opts,
    framework: "nist_csf",
  });
  if (!report || report.framework !== "nist_csf") return null;

  const functionMaturity = buildNistCsfFunctionMaturity(report.controlMonitoring);
  const overall = overallMaturityFromFunctions(functionMaturity);

  return {
    ...report,
    framework: "nist_csf",
    overallMaturityTier: overall.tier,
    overallMaturityLabel: overall.tierLabel,
    functionMaturity,
  };
}
