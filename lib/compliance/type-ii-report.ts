import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildContinuousAssessmentReport,
  type AssessmentException,
  type ControlMonitoringRow,
  type ControlTrend,
  type ContinuousAssessmentReport,
} from "@/lib/compliance/continuous-assessment";

export type { ControlTrend };
export type Soc2ControlMonitoringRow = ControlMonitoringRow;
export type Soc2TypeIIException = Omit<AssessmentException, "domain">;
export type Soc2TypeIIReport = Omit<
  ContinuousAssessmentReport,
  "framework" | "domainSummary" | "exceptions"
> & {
  framework: "soc2";
  exceptions: Soc2TypeIIException[];
};

export async function buildSoc2TypeIIReport(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    auditorReadOnly?: boolean;
    supabase?: SupabaseClient;
  },
): Promise<Soc2TypeIIReport | null> {
  const report = await buildContinuousAssessmentReport(userId, {
    ...opts,
    framework: "soc2",
  });
  if (!report) return null;
  const { domainSummary: _domainSummary, exceptions, ...rest } = report;
  return {
    ...rest,
    framework: "soc2",
    exceptions: exceptions.map(({ controlRef, title, reason }) => ({
      controlRef,
      title,
      reason,
    })),
  };
}
