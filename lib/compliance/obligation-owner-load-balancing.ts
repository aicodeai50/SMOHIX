import type { SupabaseClient } from "@supabase/supabase-js";

import { startOfUtcWeek } from "@/lib/compliance/board-obligation-forecast";
import { buildBoardObligationForecastPack } from "@/lib/compliance/board-obligation-forecast";
import {
  buildControlOwnershipMatrixPack,
  memberDisplayLabel,
  type ControlOwnershipRow,
} from "@/lib/compliance/control-ownership-matrix";
import {
  getCommitteeCapacityBudgetOrgSettings,
} from "@/lib/compliance/committee-obligation-capacity-budget";
import { buildControlTestingSchedulesPack } from "@/lib/compliance/control-testing-schedules";
import { buildGrcComplianceCalendar } from "@/lib/compliance/grc-calendar";
import { listAssessorEvidenceRequests } from "@/lib/compliance/assessor-evidence-requests";
import {
  collectRegulatoryObligationItems,
  type RegulatoryObligationItem,
} from "@/lib/compliance/regulatory-obligation-heatmap";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { listOrgMembers, type OrgMemberRow } from "@/lib/org/data";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const OBLIGATION_OWNER_LOAD_BALANCING_VERSION =
  "smohix-obligation-owner-load-balancing/1";

export const DEFAULT_LOAD_BALANCE_HORIZON_DAYS = 90;

export type FrameworkAccountableOwner = {
  framework: ComplianceFramework;
  userId: string;
  label: string;
  controlCount: number;
};

export type PeakWeekObligationAssignment = {
  obligationId: string;
  title: string;
  dueAt: string;
  framework: ComplianceFramework | null;
  dimension: RegulatoryObligationItem["dimension"];
  href: string;
  assignedOwnerUserId: string | null;
  assignedOwnerLabel: string;
};

export type OwnerLoadSlice = {
  userId: string;
  label: string;
  peakWeekObligationCount: number;
  estimatedHours: number;
  accountableFrameworks: ComplianceFramework[];
};

export type LoadBalancingSuggestion = {
  obligationId: string;
  obligationTitle: string;
  framework: ComplianceFramework | null;
  fromOwnerUserId: string | null;
  fromOwnerLabel: string;
  toOwnerUserId: string;
  toOwnerLabel: string;
  reason: string;
};

export type ObligationOwnerLoadBalancingPack = {
  version: typeof OBLIGATION_OWNER_LOAD_BALANCING_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  hoursPerObligation: number;
  peakWeekKey: string | null;
  peakWeekLabel: string | null;
  peakWeekObligationCount: number;
  frameworkOwners: FrameworkAccountableOwner[];
  assignments: PeakWeekObligationAssignment[];
  ownerLoads: OwnerLoadSlice[];
  imbalanceScore: number;
  suggestions: LoadBalancingSuggestion[];
  committeeSummary: string;
};

export function buildFrameworkPrimaryAccountables(
  rows: ControlOwnershipRow[],
): FrameworkAccountableOwner[] {
  const byFw = new Map<
    ComplianceFramework,
    Map<string, { label: string; count: number }>
  >();

  for (const row of rows) {
    if (!row.accountableUserId) continue;
    let owners = byFw.get(row.framework);
    if (!owners) {
      owners = new Map();
      byFw.set(row.framework, owners);
    }
    const existing = owners.get(row.accountableUserId) ?? {
      label: row.accountable ?? row.accountableUserId,
      count: 0,
    };
    existing.count += 1;
    owners.set(row.accountableUserId, existing);
  }

  const result: FrameworkAccountableOwner[] = [];
  for (const [framework, owners] of byFw) {
    let best: { userId: string; label: string; count: number } | null = null;
    for (const [userId, meta] of owners) {
      if (!best || meta.count > best.count) {
        best = { userId, label: meta.label, count: meta.count };
      }
    }
    if (best) {
      result.push({
        framework,
        userId: best.userId,
        label: best.label,
        controlCount: best.count,
      });
    }
  }

  return result.sort((a, b) => a.framework.localeCompare(b.framework));
}

export function filterPeakWeekObligations(input: {
  items: RegulatoryObligationItem[];
  peakWeekKey: string | null;
  currentWeekKey: string;
}): RegulatoryObligationItem[] {
  if (!input.peakWeekKey) return [];

  return input.items.filter((item) => {
    const key = startOfUtcWeek(item.dueAt);
    if (key === input.peakWeekKey) return true;
    if (item.urgency === "overdue" && input.peakWeekKey === input.currentWeekKey) {
      return key <= input.currentWeekKey;
    }
    return false;
  });
}

export function resolveDefaultOwnerForObligation(input: {
  obligation: RegulatoryObligationItem;
  frameworkOwners: FrameworkAccountableOwner[];
  members: OrgMemberRow[];
  fallbackUserId: string | null;
  fallbackLabel: string;
}): { userId: string | null; label: string } {
  if (input.obligation.framework) {
    const primary = input.frameworkOwners.find(
      (o) => o.framework === input.obligation.framework,
    );
    if (primary) {
      return { userId: primary.userId, label: primary.label };
    }
  }

  const ownerMember =
    input.members.find((m) => m.role === "owner") ??
    input.members.find((m) => m.role === "admin");
  if (ownerMember) {
    return { userId: ownerMember.userId, label: memberDisplayLabel(ownerMember) };
  }

  return {
    userId: input.fallbackUserId,
    label: input.fallbackLabel,
  };
}

export function buildOwnerLoadSlices(input: {
  assignments: PeakWeekObligationAssignment[];
  frameworkOwners: FrameworkAccountableOwner[];
  hoursPerObligation: number;
}): OwnerLoadSlice[] {
  const fwByUser = new Map<string, Set<ComplianceFramework>>();

  for (const fw of input.frameworkOwners) {
    const set = fwByUser.get(fw.userId) ?? new Set();
    set.add(fw.framework);
    fwByUser.set(fw.userId, set);
  }

  const counts = new Map<string, { label: string; count: number }>();
  for (const a of input.assignments) {
    if (!a.assignedOwnerUserId) continue;
    const existing = counts.get(a.assignedOwnerUserId) ?? {
      label: a.assignedOwnerLabel,
      count: 0,
    };
    existing.count += 1;
    counts.set(a.assignedOwnerUserId, existing);
  }

  return [...counts.entries()]
    .map(([userId, meta]) => ({
      userId,
      label: meta.label,
      peakWeekObligationCount: meta.count,
      estimatedHours: Math.round(meta.count * input.hoursPerObligation * 10) / 10,
      accountableFrameworks: [...(fwByUser.get(userId) ?? [])],
    }))
    .sort((a, b) => b.peakWeekObligationCount - a.peakWeekObligationCount);
}

export function buildLoadBalancingSuggestions(input: {
  assignments: PeakWeekObligationAssignment[];
  ownerLoads: OwnerLoadSlice[];
  frameworkOwners: FrameworkAccountableOwner[];
  maxSuggestions?: number;
}): LoadBalancingSuggestion[] {
  if (input.ownerLoads.length < 2) return [];

  const loads = input.ownerLoads.map((o) => o.peakWeekObligationCount);
  const maxLoad = Math.max(...loads);
  const minLoad = Math.min(...loads);
  const avgLoad = loads.reduce((s, n) => s + n, 0) / loads.length;

  if (maxLoad - minLoad < 2 && maxLoad <= Math.ceil(avgLoad) + 1) {
    return [];
  }

  const overloaded = input.ownerLoads.filter(
    (o) => o.peakWeekObligationCount > Math.ceil(avgLoad),
  );
  const underloaded = input.ownerLoads.filter(
    (o) => o.peakWeekObligationCount < Math.floor(avgLoad),
  );
  if (overloaded.length === 0 || underloaded.length === 0) return [];

  const target = [...underloaded].sort(
    (a, b) => a.peakWeekObligationCount - b.peakWeekObligationCount,
  )[0]!;
  const suggestions: LoadBalancingSuggestion[] = [];
  const limit = input.maxSuggestions ?? 12;

  for (const owner of overloaded) {
    const obligations = input.assignments.filter(
      (a) => a.assignedOwnerUserId === owner.userId,
    );
    for (const ob of obligations) {
      if (suggestions.length >= limit) break;

      suggestions.push({
        obligationId: ob.obligationId,
        obligationTitle: ob.title,
        framework: ob.framework,
        fromOwnerUserId: owner.userId,
        fromOwnerLabel: owner.label,
        toOwnerUserId: target.userId,
        toOwnerLabel: target.label,
        reason: `Rebalance peak week: ${owner.label} has ${owner.peakWeekObligationCount} items vs ${target.label} at ${target.peakWeekObligationCount}.`,
      });
    }
    if (suggestions.length >= limit) break;
  }

  return suggestions;
}

export function buildObligationOwnerLoadBalancingFromParts(input: {
  orgId: string | null;
  horizonDays: number;
  hoursPerObligation: number;
  items: RegulatoryObligationItem[];
  peakWeekKey: string | null;
  peakWeekLabel: string | null;
  frameworkOwners: FrameworkAccountableOwner[];
  members: OrgMemberRow[];
  now?: Date;
  generatedAt?: string;
}): ObligationOwnerLoadBalancingPack {
  const now = input.now ?? new Date();
  const currentWeekKey = startOfUtcWeek(now.toISOString());
  const peakItems = filterPeakWeekObligations({
    items: input.items,
    peakWeekKey: input.peakWeekKey,
    currentWeekKey,
  });

  const fallbackMember = input.members.find((m) => m.role === "owner") ?? input.members[0];
  const fallbackLabel = fallbackMember
    ? memberDisplayLabel(fallbackMember)
    : "Unassigned";
  const fallbackUserId = fallbackMember?.userId ?? null;

  const assignments: PeakWeekObligationAssignment[] = peakItems.map((item) => {
    const owner = resolveDefaultOwnerForObligation({
      obligation: item,
      frameworkOwners: input.frameworkOwners,
      members: input.members,
      fallbackUserId,
      fallbackLabel,
    });
    return {
      obligationId: item.id,
      title: item.title,
      dueAt: item.dueAt,
      framework: item.framework,
      dimension: item.dimension,
      href: item.href,
      assignedOwnerUserId: owner.userId,
      assignedOwnerLabel: owner.label,
    };
  });

  const ownerLoads = buildOwnerLoadSlices({
    assignments,
    frameworkOwners: input.frameworkOwners,
    hoursPerObligation: input.hoursPerObligation,
  });

  const loadCounts = ownerLoads.map((o) => o.peakWeekObligationCount);
  const imbalanceScore =
    loadCounts.length === 0
      ? 0
      : Math.max(...loadCounts) - Math.min(...loadCounts);

  const suggestions = buildLoadBalancingSuggestions({
    assignments,
    ownerLoads,
    frameworkOwners: input.frameworkOwners,
  });

  let committeeSummary: string;
  if (peakItems.length === 0) {
    committeeSummary =
      "No obligations cluster in the forecast peak week — load balancing not required.";
  } else if (suggestions.length === 0) {
    committeeSummary = `${peakItems.length} peak-week obligations are evenly distributed across ${ownerLoads.length} accountable owner(s).`;
  } else {
    committeeSummary = `${suggestions.length} rebalance suggestion(s) for peak week ${input.peakWeekKey ?? "—"} — imbalance score ${imbalanceScore} (spread across ${ownerLoads.length} owners).`;
  }

  return {
    version: OBLIGATION_OWNER_LOAD_BALANCING_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    hoursPerObligation: input.hoursPerObligation,
    peakWeekKey: input.peakWeekKey,
    peakWeekLabel: input.peakWeekLabel,
    peakWeekObligationCount: peakItems.length,
    frameworkOwners: input.frameworkOwners,
    assignments,
    ownerLoads,
    imbalanceScore,
    suggestions,
    committeeSummary,
  };
}

export async function buildObligationOwnerLoadBalancingPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ObligationOwnerLoadBalancingPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? DEFAULT_LOAD_BALANCE_HORIZON_DAYS;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [calendar, testing, evidenceRequests, forecast, ownership, members, capacitySettings] =
    await Promise.all([
      buildGrcComplianceCalendar(userId, { orgId: opts.orgId, horizonDays, supabase }),
      buildControlTestingSchedulesPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
      listAssessorEvidenceRequests(opts.orgId, supabase),
      buildBoardObligationForecastPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
      buildControlOwnershipMatrixPack(userId, { orgId: opts.orgId, supabase }),
      listOrgMembers(opts.orgId, { supabase }),
      getCommitteeCapacityBudgetOrgSettings(opts.orgId, supabase),
    ]);

  const items = collectRegulatoryObligationItems({
    calendar,
    testing,
    evidenceRequests,
    horizonDays,
  });

  const frameworkOwners = ownership
    ? buildFrameworkPrimaryAccountables(ownership.rows)
    : [];

  const peakBucket = forecast?.buckets.find((b) => b.weekKey === forecast.peakWeekKey);

  return buildObligationOwnerLoadBalancingFromParts({
    orgId: opts.orgId,
    horizonDays,
    hoursPerObligation: capacitySettings.hoursPerObligation,
    items,
    peakWeekKey: forecast?.peakWeekKey ?? null,
    peakWeekLabel: peakBucket?.weekLabel ?? null,
    frameworkOwners,
    members,
  });
}

export function obligationOwnerLoadBalancingToCsv(
  pack: ObligationOwnerLoadBalancingPack,
): string {
  const lines = [
    "section,user_or_obligation,framework,count_or_title,estimated_hours,from_owner,to_owner,reason",
    ...pack.ownerLoads.map((o) =>
      [
        "owner_load",
        o.userId,
        o.accountableFrameworks.join(";"),
        o.peakWeekObligationCount,
        o.estimatedHours,
        "",
        "",
        "",
      ].join(","),
    ),
    ...pack.suggestions.map((s) =>
      [
        "suggestion",
        s.obligationId,
        s.framework ?? "",
        JSON.stringify(s.obligationTitle),
        "",
        JSON.stringify(s.fromOwnerLabel),
        JSON.stringify(s.toOwnerLabel),
        JSON.stringify(s.reason),
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
