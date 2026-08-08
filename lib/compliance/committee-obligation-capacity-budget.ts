import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildBoardObligationForecastPack,
  type BoardObligationForecastPack,
} from "@/lib/compliance/board-obligation-forecast";
import { buildControlOwnershipMatrixPack } from "@/lib/compliance/control-ownership-matrix";
import { listOrgMembers } from "@/lib/org/data";
import type { OrgRole } from "@/lib/org/roles";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const COMMITTEE_OBLIGATION_CAPACITY_BUDGET_VERSION =
  "smohix-committee-obligation-capacity-budget/1";

export const DEFAULT_CAPACITY_HORIZON_DAYS = 90;

const CAPACITY_OWNER_ROLES: OrgRole[] = [
  "owner",
  "admin",
  "security_reviewer",
  "operator",
];

export type CommitteeCapacityBudgetOrgSettings = {
  hoursPerObligation: number;
  ownerHoursPerWeek: number;
};

export type CommitteeCapacityWeekRow = {
  weekKey: string;
  weekLabel: string;
  isCurrentWeek: boolean;
  obligationCount: number;
  overdueCount: number;
  estimatedOwnerHours: number;
  availableOwnerHours: number;
  shortfallHours: number;
  utilizationPercent: number;
  isShortfall: boolean;
};

export type CommitteeObligationCapacityBudgetPack = {
  version: typeof COMMITTEE_OBLIGATION_CAPACITY_BUDGET_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  settings: CommitteeCapacityBudgetOrgSettings;
  capacityOwnerCount: number;
  accountableOwnerCount: number;
  forecast: BoardObligationForecastPack | null;
  weeks: CommitteeCapacityWeekRow[];
  shortfallWeekCount: number;
  peakShortfallHours: number;
  peakShortfallWeekKey: string | null;
  totalEstimatedHours: number;
  totalAvailableHours: number;
  committeeSummary: string;
};

export function countCapacityOwners(members: { role: OrgRole }[]): number {
  const n = members.filter((m) => CAPACITY_OWNER_ROLES.includes(m.role)).length;
  return Math.max(1, n);
}

export function countAccountableOwners(rows: { accountableUserId: string | null }[]): number {
  const ids = new Set(
    rows.map((r) => r.accountableUserId).filter((id): id is string => Boolean(id)),
  );
  return ids.size;
}

export function resolveCapacityOwnerCount(input: {
  memberCount: number;
  accountableCount: number;
}): number {
  return Math.max(1, input.memberCount, input.accountableCount);
}

export function buildCapacityWeekRows(input: {
  forecast: BoardObligationForecastPack;
  settings: CommitteeCapacityBudgetOrgSettings;
  capacityOwnerCount: number;
}): CommitteeCapacityWeekRow[] {
  const availablePerWeek =
    input.capacityOwnerCount * input.settings.ownerHoursPerWeek;

  return input.forecast.buckets.map((bucket) => {
    const estimatedOwnerHours =
      Math.round(bucket.totalCount * input.settings.hoursPerObligation * 10) / 10;
    const availableOwnerHours =
      Math.round(availablePerWeek * 10) / 10;
    const shortfallHours = Math.max(
      0,
      Math.round((estimatedOwnerHours - availableOwnerHours) * 10) / 10,
    );
    const utilizationPercent =
      availableOwnerHours <= 0
        ? 100
        : Math.min(100, Math.round((estimatedOwnerHours / availableOwnerHours) * 100));

    return {
      weekKey: bucket.weekKey,
      weekLabel: bucket.weekLabel,
      isCurrentWeek: bucket.isCurrentWeek,
      obligationCount: bucket.totalCount,
      overdueCount: bucket.overdueCount,
      estimatedOwnerHours,
      availableOwnerHours,
      shortfallHours,
      utilizationPercent,
      isShortfall: shortfallHours > 0,
    };
  });
}

export function buildCommitteeObligationCapacityBudgetFromParts(input: {
  orgId: string | null;
  horizonDays: number;
  settings: CommitteeCapacityBudgetOrgSettings;
  capacityOwnerCount: number;
  accountableOwnerCount: number;
  forecast: BoardObligationForecastPack | null;
  generatedAt?: string;
}): CommitteeObligationCapacityBudgetPack {
  const forecast = input.forecast;
  const weeks =
    forecast !== null
      ? buildCapacityWeekRows({
          forecast,
          settings: input.settings,
          capacityOwnerCount: input.capacityOwnerCount,
        })
      : [];

  const shortfallWeeks = weeks.filter((w) => w.isShortfall);
  const peakShortfall = shortfallWeeks.reduce(
    (best, w) => (w.shortfallHours > best.shortfallHours ? w : best),
    shortfallWeeks[0] ?? { shortfallHours: 0, weekKey: null as unknown as string },
  );

  const totalEstimatedHours =
    Math.round(weeks.reduce((s, w) => s + w.estimatedOwnerHours, 0) * 10) / 10;
  const totalAvailableHours =
    Math.round(weeks.reduce((s, w) => s + w.availableOwnerHours, 0) * 10) / 10;

  let committeeSummary: string;
  if (weeks.length === 0) {
    committeeSummary = "No forecast weeks — add obligations to the GRC calendar to model committee capacity.";
  } else if (shortfallWeeks.length === 0) {
    committeeSummary = `${input.capacityOwnerCount} capacity owner(s) at ${input.settings.ownerHoursPerWeek}h/week cover all ${weeks.length} forecast weeks (${totalEstimatedHours}h estimated vs ${totalAvailableHours}h available).`;
  } else {
    committeeSummary = `${shortfallWeeks.length} week(s) exceed capacity — peak shortfall ${peakShortfall.shortfallHours}h in week ${peakShortfall.weekKey ?? "—"}. Consider deferring obligations, descoping frameworks, or adding owners.`;
  }

  return {
    version: COMMITTEE_OBLIGATION_CAPACITY_BUDGET_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    settings: input.settings,
    capacityOwnerCount: input.capacityOwnerCount,
    accountableOwnerCount: input.accountableOwnerCount,
    forecast,
    weeks,
    shortfallWeekCount: shortfallWeeks.length,
    peakShortfallHours: peakShortfall.shortfallHours,
    peakShortfallWeekKey:
      peakShortfall.shortfallHours > 0 ? peakShortfall.weekKey : null,
    totalEstimatedHours,
    totalAvailableHours,
    committeeSummary,
  };
}

export async function getCommitteeCapacityBudgetOrgSettings(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<CommitteeCapacityBudgetOrgSettings> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data } = await client
    .from("organizations")
    .select(
      "compliance_capacity_hours_per_obligation, compliance_capacity_owner_hours_per_week",
    )
    .eq("id", orgId)
    .maybeSingle();

  return {
    hoursPerObligation:
      Number(data?.compliance_capacity_hours_per_obligation ?? 2) || 2,
    ownerHoursPerWeek:
      Number(data?.compliance_capacity_owner_hours_per_week ?? 8) || 8,
  };
}

export async function updateCommitteeCapacityBudgetOrgSettings(
  orgId: string,
  input: Partial<CommitteeCapacityBudgetOrgSettings>,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const patch: Record<string, unknown> = {};
  if (input.hoursPerObligation !== undefined) {
    patch.compliance_capacity_hours_per_obligation = input.hoursPerObligation;
  }
  if (input.ownerHoursPerWeek !== undefined) {
    patch.compliance_capacity_owner_hours_per_week = input.ownerHoursPerWeek;
  }
  if (Object.keys(patch).length === 0) return true;

  const { error } = await client.from("organizations").update(patch).eq("id", orgId);
  return !error;
}

export async function buildCommitteeObligationCapacityBudgetPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<CommitteeObligationCapacityBudgetPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? DEFAULT_CAPACITY_HORIZON_DAYS;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [forecast, settings, members, ownership] = await Promise.all([
    buildBoardObligationForecastPack(userId, {
      orgId: opts.orgId,
      horizonDays,
      supabase,
    }),
    getCommitteeCapacityBudgetOrgSettings(opts.orgId, supabase),
    listOrgMembers(opts.orgId, { supabase }),
    buildControlOwnershipMatrixPack(userId, { orgId: opts.orgId, supabase }),
  ]);

  const memberCapacityCount = countCapacityOwners(members);
  const accountableCount = ownership
    ? countAccountableOwners(ownership.rows)
    : 0;
  const capacityOwnerCount = resolveCapacityOwnerCount({
    memberCount: memberCapacityCount,
    accountableCount: accountableCount,
  });

  return buildCommitteeObligationCapacityBudgetFromParts({
    orgId: opts.orgId,
    horizonDays,
    settings,
    capacityOwnerCount,
    accountableOwnerCount: accountableCount,
    forecast,
  });
}

export function committeeObligationCapacityBudgetToCsv(
  pack: CommitteeObligationCapacityBudgetPack,
): string {
  const lines = [
    "week_key,obligations,estimated_hours,available_hours,shortfall_hours,utilization_percent,is_shortfall",
    ...pack.weeks.map((w) =>
      [
        w.weekKey,
        w.obligationCount,
        w.estimatedOwnerHours,
        w.availableOwnerHours,
        w.shortfallHours,
        w.utilizationPercent,
        w.isShortfall ? "1" : "0",
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
