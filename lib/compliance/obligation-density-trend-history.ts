import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildBoardObligationForecastPack,
  densityScoreForCount,
  startOfUtcWeek,
  weekLabel,
  type BoardObligationForecastPack,
} from "@/lib/compliance/board-obligation-forecast";
import {
  getObligationDensityAlertOrgSettings,
  listObligationDensityAlertLog,
  type ObligationDensityAlertLogRow,
  type ObligationDensityAlertOrgSettings,
  type ObligationDensityAlertType,
} from "@/lib/compliance/obligation-density-alerting";
import { buildControlTestingSchedulesPack } from "@/lib/compliance/control-testing-schedules";
import { buildGrcComplianceCalendar } from "@/lib/compliance/grc-calendar";
import { listAssessorEvidenceRequests } from "@/lib/compliance/assessor-evidence-requests";
import {
  collectRegulatoryObligationItems,
  type RegulatoryObligationItem,
} from "@/lib/compliance/regulatory-obligation-heatmap";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const OBLIGATION_DENSITY_TREND_HISTORY_VERSION =
  "zentro-obligation-density-trend-history/1";

export const DEFAULT_TRAILING_QUARTER_DAYS = 90;
export const DEFAULT_TREND_WEEK_COUNT = 13;

export type DensityTrendWeekPoint = {
  weekKey: string;
  weekLabel: string;
  isCurrentWeek: boolean;
  isFuture: boolean;
  obligationCount: number;
  overdueInWeek: number;
  densityScore: number;
  alertDeliveryCount: number;
  alertTypes: ObligationDensityAlertType[];
  aboveWeeklyThreshold: boolean;
};

export type ObligationDensityTrendHistoryPack = {
  version: typeof OBLIGATION_DENSITY_TREND_HISTORY_VERSION;
  generatedAt: string;
  orgId: string | null;
  trailingDays: number;
  weekKeys: string[];
  settings: ObligationDensityAlertOrgSettings;
  points: DensityTrendWeekPoint[];
  peakTrailingWeekKey: string | null;
  peakTrailingCount: number;
  totalAlertDeliveries: number;
  weeksWithAlerts: number;
  forwardPeakWeekKey: string | null;
  forwardPeakCount: number;
  capacitySummary: string;
};

export function buildTrailingQuarterWeekKeys(
  trailingDays: number = DEFAULT_TRAILING_QUARTER_DAYS,
  now = new Date(),
): string[] {
  const weekCount = Math.max(
    4,
    Math.min(DEFAULT_TREND_WEEK_COUNT, Math.ceil(trailingDays / 7)),
  );
  const keys: string[] = [];
  for (let i = weekCount - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 7 * 86_400_000);
    keys.push(startOfUtcWeek(d.toISOString()));
  }
  return keys;
}

export function bucketObligationCountsByWeek(
  items: RegulatoryObligationItem[],
  weekKeys: string[],
): Map<string, { total: number; overdue: number }> {
  const keySet = new Set(weekKeys);
  const counts = new Map<string, { total: number; overdue: number }>(
    weekKeys.map((k) => [k, { total: 0, overdue: 0 }]),
  );

  for (const item of items) {
    const key = startOfUtcWeek(item.dueAt);
    if (!keySet.has(key)) continue;
    const acc = counts.get(key)!;
    acc.total += 1;
    if (item.urgency === "overdue") acc.overdue += 1;
  }

  return counts;
}

export function bucketAlertDeliveriesByWeek(
  rows: ObligationDensityAlertLogRow[],
  weekKeys: string[],
): Map<
  string,
  { count: number; types: Set<ObligationDensityAlertType> }
> {
  const keySet = new Set(weekKeys);
  const buckets = new Map<string, { count: number; types: Set<ObligationDensityAlertType> }>(
    weekKeys.map((k) => [k, { count: 0, types: new Set() }]),
  );

  for (const row of rows) {
    const key = startOfUtcWeek(row.createdAt);
    if (!keySet.has(key)) continue;
    const acc = buckets.get(key)!;
    acc.count += 1;
    acc.types.add(row.alertType);
  }

  return buckets;
}

export function buildObligationDensityTrendHistoryFromParts(input: {
  orgId: string | null;
  trailingDays: number;
  weekKeys: string[];
  items: RegulatoryObligationItem[];
  alertRows: ObligationDensityAlertLogRow[];
  settings: ObligationDensityAlertOrgSettings;
  forecast: BoardObligationForecastPack | null;
  now?: Date;
  generatedAt?: string;
}): ObligationDensityTrendHistoryPack {
  const now = input.now ?? new Date();
  const currentWeekKey = startOfUtcWeek(now.toISOString());
  const obligationByWeek = bucketObligationCountsByWeek(input.items, input.weekKeys);
  const alertsByWeek = bucketAlertDeliveriesByWeek(input.alertRows, input.weekKeys);

  const trailingCounts = input.weekKeys.map((k) => obligationByWeek.get(k)?.total ?? 0);
  const maxTrailing = Math.max(1, ...trailingCounts);

  const trailingPoints: DensityTrendWeekPoint[] = input.weekKeys.map((weekKey) => {
    const ob = obligationByWeek.get(weekKey) ?? { total: 0, overdue: 0 };
    const alerts = alertsByWeek.get(weekKey) ?? { count: 0, types: new Set() };
    return {
      weekKey,
      weekLabel: weekLabel(weekKey),
      isCurrentWeek: weekKey === currentWeekKey,
      isFuture: false,
      obligationCount: ob.total,
      overdueInWeek: ob.overdue,
      densityScore: densityScoreForCount(ob.total, maxTrailing),
      alertDeliveryCount: alerts.count,
      alertTypes: [...alerts.types],
      aboveWeeklyThreshold: ob.total >= input.settings.weeklyThreshold,
    };
  });

  const forwardPoints: DensityTrendWeekPoint[] = [];
  if (input.forecast) {
    const trailingSet = new Set(input.weekKeys);
    const forwardBuckets = input.forecast.buckets.filter((b) => !trailingSet.has(b.weekKey));
    const maxForward = Math.max(1, ...forwardBuckets.map((b) => b.totalCount), 1);
    for (const b of forwardBuckets) {
      forwardPoints.push({
        weekKey: b.weekKey,
        weekLabel: b.weekLabel,
        isCurrentWeek: b.isCurrentWeek,
        isFuture: true,
        obligationCount: b.totalCount,
        overdueInWeek: b.overdueCount,
        densityScore: densityScoreForCount(b.totalCount, maxForward),
        alertDeliveryCount: 0,
        alertTypes: [],
        aboveWeeklyThreshold: b.totalCount >= input.settings.weeklyThreshold,
      });
    }
  }

  const points = [...trailingPoints, ...forwardPoints];

  const peakTrailing = trailingPoints.reduce(
    (best, p) => (p.obligationCount > best.obligationCount ? p : best),
    trailingPoints[0] ?? { weekKey: null as unknown as string, obligationCount: 0 },
  );

  const totalAlertDeliveries = input.alertRows.length;
  const weeksWithAlerts = trailingPoints.filter((p) => p.alertDeliveryCount > 0).length;

  const capacitySummary =
    peakTrailing.obligationCount === 0 && totalAlertDeliveries === 0
      ? "No obligation clustering or density alerts in the trailing quarter — capacity is stable."
      : `Trailing quarter peak ${peakTrailing.weekKey} (${peakTrailing.obligationCount} obligations due). ${weeksWithAlerts} week(s) with density alert deliveries; weekly threshold ${input.settings.weeklyThreshold}.` +
        (input.forecast?.peakWeekKey
          ? ` Forward peak ${input.forecast.peakWeekKey} (${input.forecast.peakWeekCount}).`
          : "");

  return {
    version: OBLIGATION_DENSITY_TREND_HISTORY_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    trailingDays: input.trailingDays,
    weekKeys: input.weekKeys,
    settings: input.settings,
    points,
    peakTrailingWeekKey:
      peakTrailing.obligationCount > 0 ? peakTrailing.weekKey : null,
    peakTrailingCount: peakTrailing.obligationCount,
    totalAlertDeliveries,
    weeksWithAlerts,
    forwardPeakWeekKey: input.forecast?.peakWeekKey ?? null,
    forwardPeakCount: input.forecast?.peakWeekCount ?? 0,
    capacitySummary,
  };
}

export async function buildObligationDensityTrendHistoryPack(
  userId: string,
  opts: {
    orgId: string | null;
    trailingDays?: number;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ObligationDensityTrendHistoryPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const trailingDays = opts.trailingDays ?? DEFAULT_TRAILING_QUARTER_DAYS;
  const horizonDays = opts.horizonDays ?? trailingDays;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const weekKeys = buildTrailingQuarterWeekKeys(trailingDays);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - trailingDays);

  const [calendar, testing, evidenceRequests, settings, alertRows, forecast] =
    await Promise.all([
      buildGrcComplianceCalendar(userId, { orgId: opts.orgId, horizonDays, supabase }),
      buildControlTestingSchedulesPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
      listAssessorEvidenceRequests(opts.orgId, supabase),
      getObligationDensityAlertOrgSettings(opts.orgId, supabase),
      listObligationDensityAlertLog(opts.orgId, { supabase, limit: 500 }),
      buildBoardObligationForecastPack(userId, {
        orgId: opts.orgId,
        horizonDays,
        supabase,
      }),
    ]);

  const items = collectRegulatoryObligationItems({
    calendar,
    testing,
    evidenceRequests,
    horizonDays,
  });

  const filteredAlerts = alertRows.filter(
    (r) => new Date(r.createdAt).getTime() >= since.getTime(),
  );

  return buildObligationDensityTrendHistoryFromParts({
    orgId: opts.orgId,
    trailingDays,
    weekKeys,
    items,
    alertRows: filteredAlerts,
    settings,
    forecast,
  });
}

export function obligationDensityTrendHistoryToCsv(
  pack: ObligationDensityTrendHistoryPack,
): string {
  const lines = [
    "week_key,is_future,obligations,overdue,density_score,alert_deliveries,above_threshold",
    ...pack.points.map((p) =>
      [
        p.weekKey,
        p.isFuture ? "1" : "0",
        p.obligationCount,
        p.overdueInWeek,
        p.densityScore,
        p.alertDeliveryCount,
        p.aboveWeeklyThreshold ? "1" : "0",
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
