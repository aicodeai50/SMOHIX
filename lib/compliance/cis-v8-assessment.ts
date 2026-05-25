import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildCisIgReadiness,
  overallIgPostureFromGroups,
  type CisIgReadiness,
  type CisImplementationGroup,
} from "@/lib/compliance/cis-v8-ig-readiness";
import {
  buildContinuousAssessmentReport,
  type AssessmentException,
  type ControlMonitoringRow,
  type ControlTrend,
  type ContinuousAssessmentReport,
} from "@/lib/compliance/continuous-assessment";

export type { ControlTrend, CisIgReadiness, CisImplementationGroup };
export type CisSafeguardMonitoringRow = ControlMonitoringRow;
export type CisV8AssessmentException = AssessmentException;
export type CisV8AssessmentReport = ContinuousAssessmentReport & {
  framework: "cis_v8";
  attainedIg: CisImplementationGroup;
  attainedIgLabel: string;
  igReadiness: CisIgReadiness[];
};

export async function buildCisV8AssessmentReport(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<CisV8AssessmentReport | null> {
  const report = await buildContinuousAssessmentReport(userId, {
    ...opts,
    framework: "cis_v8",
  });
  if (!report || report.framework !== "cis_v8") return null;

  const igReadiness = buildCisIgReadiness(report.controlMonitoring);
  const posture = overallIgPostureFromGroups(igReadiness);

  return {
    ...report,
    framework: "cis_v8",
    attainedIg: posture.attainedIg,
    attainedIgLabel: posture.attainedLabel,
    igReadiness,
  };
}
