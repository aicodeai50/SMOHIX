import type { SupabaseClient } from "@supabase/supabase-js";

import { BASELINE_COMPARISON_FRAMEWORKS } from "@/lib/compliance/baseline-comparison";
import { listAssessorEvidenceRequests } from "@/lib/compliance/assessor-evidence-requests";
import { buildControlTestingSchedulesPack } from "@/lib/compliance/control-testing-schedules";
import { buildGrcComplianceCalendar } from "@/lib/compliance/grc-calendar";
import {
  collectRegulatoryObligationItems,
  type ObligationUrgency,
  type RegulatoryObligationItem,
} from "@/lib/compliance/regulatory-obligation-heatmap";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const BOARD_OBLIGATION_FORECAST_VERSION = "smohix-board-obligation-forecast/1";

export const DEFAULT_FORECAST_HORIZON_DAYS = 90;

export type ForecastFrameworkSlice = {
  framework: ComplianceFramework;
  label: string;
  count: number;
};

export type ObligationForecastWeekBucket = {
  weekKey: string;
  weekLabel: string;
  isCurrentWeek: boolean;
  totalCount: number;
  overdueCount: number;
  dueSoonCount: number;
  upcomingCount: number;
  densityScore: number;
  byFramework: ForecastFrameworkSlice[];
};

export type ObligationForecastMilestone = {
  dueAt: string;
  title: string;
  urgency: ObligationUrgency;
  dimension: RegulatoryObligationItem["dimension"];
  href: string;
  framework: ComplianceFramework | null;
};

export type BoardObligationForecastPack = {
  version: typeof BOARD_OBLIGATION_FORECAST_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  forecastWeekCount: number;
  weekKeys: string[];
  buckets: ObligationForecastWeekBucket[];
  peakWeekKey: string | null;
  peakWeekCount: number;
  totalForecastObligations: number;
  currentOverdue: number;
  currentDueSoon: number;
  committeeSummary: string;
  milestones: ObligationForecastMilestone[];
};

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  soc2: "SOC 2",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nist_csf: "NIST CSF",
  cis_v8: "CIS v8",
  cmmc_l2: "CMMC L2",
  gdpr_art32: "GDPR Art. 32",
};

export function startOfUtcWeek(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function buildForecastWeekKeys(horizonDays: number, now = new Date()): string[] {
  const weekCount = Math.max(4, Math.min(14, Math.ceil(horizonDays / 7)));
  const current = startOfUtcWeek(now.toISOString());
  const keys: string[] = [];
  for (let i = 0; i < weekCount; i += 1) {
    const d = new Date(current);
    d.setUTCDate(d.getUTCDate() + i * 7);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export function weekLabel(weekKey: string): string {
  const end = new Date(weekKey);
  end.setUTCDate(end.getUTCDate() + 6);
  return `${weekKey} → ${end.toISOString().slice(0, 10)}`;
}

export function densityScoreForCount(count: number, maxCount: number): number {
  if (count <= 0 || maxCount <= 0) return 0;
  return Math.min(100, Math.round((count / maxCount) * 100));
}

export function buildBoardObligationForecastFromItems(input: {
  orgId: string | null;
  horizonDays: number;
  items: RegulatoryObligationItem[];
  now?: Date;
  generatedAt?: string;
}): BoardObligationForecastPack {
  const now = input.now ?? new Date();
  const weekKeys = buildForecastWeekKeys(input.horizonDays, now);
  const currentWeekKey = weekKeys[0] ?? startOfUtcWeek(now.toISOString());
  const weekKeySet = new Set(weekKeys);

  type Acc = {
    total: number;
    overdue: number;
    dueSoon: number;
    upcoming: number;
    byFw: Map<ComplianceFramework, number>;
  };

  const accByWeek = new Map<string, Acc>();
  for (const key of weekKeys) {
    accByWeek.set(key, { total: 0, overdue: 0, dueSoon: 0, upcoming: 0, byFw: new Map() });
  }

  let currentOverdue = 0;
  let currentDueSoon = 0;

  for (const item of input.items) {
    if (item.urgency === "overdue") currentOverdue += 1;
    if (item.urgency === "due_soon") currentDueSoon += 1;

    let bucketKey = startOfUtcWeek(item.dueAt);
    if (!weekKeySet.has(bucketKey)) {
      if (item.urgency === "overdue") {
        bucketKey = currentWeekKey;
      } else {
        continue;
      }
    }

    const acc = accByWeek.get(bucketKey);
    if (!acc) continue;

    acc.total += 1;
    if (item.urgency === "overdue") acc.overdue += 1;
    else if (item.urgency === "due_soon") acc.dueSoon += 1;
    else acc.upcoming += 1;

    const fw = item.framework;
    if (fw) {
      acc.byFw.set(fw, (acc.byFw.get(fw) ?? 0) + 1);
    }
  }

  const rawCounts = weekKeys.map((k) => accByWeek.get(k)?.total ?? 0);
  const maxCount = Math.max(1, ...rawCounts);

  const buckets: ObligationForecastWeekBucket[] = weekKeys.map((weekKey) => {
    const acc = accByWeek.get(weekKey)!;
    const byFramework: ForecastFrameworkSlice[] = BASELINE_COMPARISON_FRAMEWORKS.map((fw) => ({
      framework: fw,
      label: FRAMEWORK_LABELS[fw],
      count: acc.byFw.get(fw) ?? 0,
    })).filter((s) => s.count > 0);

    return {
      weekKey,
      weekLabel: weekLabel(weekKey),
      isCurrentWeek: weekKey === currentWeekKey,
      totalCount: acc.total,
      overdueCount: acc.overdue,
      dueSoonCount: acc.dueSoon,
      upcomingCount: acc.upcoming,
      densityScore: densityScoreForCount(acc.total, maxCount),
      byFramework,
    };
  });

  const peak = buckets.reduce(
    (best, b) => (b.totalCount > best.totalCount ? b : best),
    buckets[0] ?? { weekKey: null as unknown as string, totalCount: 0 },
  );

  const totalForecastObligations = input.items.length;

  const committeeSummary =
    totalForecastObligations === 0
      ? "No open obligations in the forecast horizon — committee prep can focus on posture and vendor reviews."
      : peak.totalCount > 0
        ? `${totalForecastObligations} open obligations across ${input.horizonDays} days. Peak density week ${peak.weekKey} (${peak.totalCount} items). ${currentOverdue} overdue now; ${currentDueSoon} due within 7 days.`
        : `${totalForecastObligations} open obligations; no forward week clustering beyond current backlog.`;

  const milestones: ObligationForecastMilestone[] = [...input.items]
    .sort((a, b) => {
      const rank = { overdue: 0, due_soon: 1, upcoming: 2 };
      return rank[a.urgency] - rank[b.urgency] || a.dueAt.localeCompare(b.dueAt);
    })
    .slice(0, 15)
    .map((item) => ({
      dueAt: item.dueAt,
      title: item.title,
      urgency: item.urgency,
      dimension: item.dimension,
      href: item.href,
      framework: item.framework,
    }));

  return {
    version: BOARD_OBLIGATION_FORECAST_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    forecastWeekCount: weekKeys.length,
    weekKeys,
    buckets,
    peakWeekKey: peak.totalCount > 0 ? peak.weekKey : null,
    peakWeekCount: peak.totalCount,
    totalForecastObligations,
    currentOverdue,
    currentDueSoon,
    committeeSummary,
    milestones,
  };
}

export async function buildBoardObligationForecastPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<BoardObligationForecastPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? DEFAULT_FORECAST_HORIZON_DAYS;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [calendar, testing, evidenceRequests] = await Promise.all([
    buildGrcComplianceCalendar(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildControlTestingSchedulesPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    listAssessorEvidenceRequests(opts.orgId, supabase),
  ]);

  const items = collectRegulatoryObligationItems({
    calendar,
    testing,
    evidenceRequests,
    horizonDays,
  });

  return buildBoardObligationForecastFromItems({
    orgId: opts.orgId,
    horizonDays,
    items,
  });
}

export function boardObligationForecastToCsv(pack: BoardObligationForecastPack): string {
  const lines = [
    "week_key,total,overdue,due_soon,upcoming,density_score",
    ...pack.buckets.map((b) =>
      [b.weekKey, b.totalCount, b.overdueCount, b.dueSoonCount, b.upcomingCount, b.densityScore].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
