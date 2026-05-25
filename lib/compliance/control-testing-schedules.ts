import type { SupabaseClient } from "@supabase/supabase-js";

import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
import type { ControlAttestationRow } from "@/lib/compliance/attestation/types";
import {
  BASELINE_COMPARISON_FRAMEWORKS,
  FRAMEWORK_CONSOLE_PATHS,
} from "@/lib/compliance/baseline-comparison";
import { buildEvidenceFreshnessDashboard } from "@/lib/compliance/evidence-freshness";
import { listEvidenceBundlesForOrg } from "@/lib/compliance/evidence-bundle";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const CONTROL_TESTING_SCHEDULES_VERSION = "zentro-control-testing-schedules/1";

export const EVIDENCE_COLLECTION_CADENCE_DAYS = 30;
export const ATTESTATION_COLLECTION_LEAD_DAYS = 14;
export const CHECKPOINT_EVIDENCE_WINDOW_DAYS = 30;
export const FRESHNESS_RETEST_CADENCE_DAYS = 7;

export type ControlTestingScheduleKind =
  | "attestation_evidence"
  | "framework_checkpoint"
  | "freshness_retest"
  | "scheduled_bundle";

export type ControlTestingScheduleStatus = "due" | "upcoming" | "overdue" | "completed";

export type ControlTestingSchedule = {
  id: string;
  kind: ControlTestingScheduleKind;
  title: string;
  cadenceLabel: string;
  nextRunAt: string;
  windowStart: string;
  windowEnd: string;
  status: ControlTestingScheduleStatus;
  controlCount: number;
  controlIds: string[];
  framework: ComplianceFramework | null;
  detail: string;
  href: string;
};

export type ControlTestingSchedulesPack = {
  version: typeof CONTROL_TESTING_SCHEDULES_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  schedules: ControlTestingSchedule[];
  dueCount: number;
  upcomingCount: number;
  overdueCount: number;
  attestationScheduleCount: number;
  checkpointScheduleCount: number;
  freshnessRetestCount: number;
  bundleScheduleCount: number;
};

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  soc2: "SOC 2 Type II",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nist_csf: "NIST CSF 2.0",
  cis_v8: "CIS Controls v8",
  cmmc_l2: "CMMC Level 2",
  gdpr_art32: "GDPR Art. 32",
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function endOfUtcQuarter(now = new Date()): Date {
  const month = now.getUTCMonth();
  const quarterEndMonth = Math.floor(month / 3) * 3 + 2;
  return new Date(Date.UTC(now.getUTCFullYear(), quarterEndMonth + 1, 0, 23, 59, 59, 999));
}

function scheduleStatus(
  nextRunAt: string,
  windowEnd: string,
  now = new Date(),
): ControlTestingScheduleStatus {
  const next = new Date(nextRunAt).getTime();
  const end = new Date(windowEnd).getTime();
  const t = now.getTime();
  if (t > end) return "completed";
  if (t >= next) return "due";
  if (next - t <= 7 * 86_400_000) return "upcoming";
  return "upcoming";
}

export function buildAttestationTestingSchedules(
  attestations: ControlAttestationRow[],
  now = new Date(),
): ControlTestingSchedule[] {
  const schedules: ControlTestingSchedule[] = [];

  const open = attestations.filter((a) => a.status === "pending" || a.status === "overdue");
  if (open.length === 0) return schedules;

  const byDueWeek = new Map<string, ControlAttestationRow[]>();
  for (const row of open) {
    const due = new Date(row.dueAt);
    const windowStart = addDays(due, -ATTESTATION_COLLECTION_LEAD_DAYS);
    const key = windowStart.toISOString().slice(0, 10);
    const list = byDueWeek.get(key) ?? [];
    list.push(row);
    byDueWeek.set(key, list);
  }

  for (const [weekKey, rows] of byDueWeek) {
    const earliestDue = rows.reduce(
      (min, r) => (new Date(r.dueAt) < new Date(min) ? r.dueAt : min),
      rows[0].dueAt,
    );
    const windowStart = addDays(new Date(earliestDue), -ATTESTATION_COLLECTION_LEAD_DAYS);
    const windowEnd = earliestDue;
    const overdue = rows.some((r) => r.status === "overdue");
    const nextRunAt =
      overdue || windowStart.getTime() <= now.getTime()
        ? now.toISOString()
        : windowStart.toISOString();

    schedules.push({
      id: `attestation-window-${weekKey}`,
      kind: "attestation_evidence",
      title: `Attestation evidence window (${rows.length} controls)`,
      cadenceLabel: `${ATTESTATION_COLLECTION_LEAD_DAYS}d before due`,
      nextRunAt,
      windowStart: windowStart.toISOString(),
      windowEnd,
      status: overdue ? "overdue" : scheduleStatus(nextRunAt, windowEnd, now),
      controlCount: rows.length,
      controlIds: rows.map((r) => r.control.id),
      framework: null,
      detail: `Collect audit and policy proof before attestations due ${earliestDue.slice(0, 10)}`,
      href: "/governance/compliance/attestations",
    });
  }

  return schedules;
}

export function buildFrameworkCheckpointSchedules(now = new Date()): ControlTestingSchedule[] {
  const quarterEnd = endOfUtcQuarter(now);
  const windowStart = addDays(quarterEnd, -CHECKPOINT_EVIDENCE_WINDOW_DAYS);
  const nextRunAt =
    windowStart.getTime() <= now.getTime() ? now.toISOString() : windowStart.toISOString();

  return BASELINE_COMPARISON_FRAMEWORKS.map((framework) => ({
    id: `checkpoint-${framework}-${quarterEnd.toISOString().slice(0, 10)}`,
    kind: "framework_checkpoint" as const,
    title: `${FRAMEWORK_LABELS[framework]} quarterly test`,
    cadenceLabel: "Quarterly · audit season",
    nextRunAt,
    windowStart: windowStart.toISOString(),
    windowEnd: quarterEnd.toISOString(),
    status: scheduleStatus(nextRunAt, quarterEnd.toISOString(), now),
    controlCount: 0,
    controlIds: [],
    framework,
    detail: `${CHECKPOINT_EVIDENCE_WINDOW_DAYS}d evidence collection window before quarter close`,
    href: FRAMEWORK_CONSOLE_PATHS[framework],
  }));
}

export function buildFreshnessRetestSchedules(
  staleControlIds: string[],
  now = new Date(),
): ControlTestingSchedule[] {
  if (staleControlIds.length === 0) return [];

  const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = nextMonday.getUTCDay();
  const add = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  nextMonday.setUTCDate(nextMonday.getUTCDate() + add);
  nextMonday.setUTCHours(9, 0, 0, 0);

  const windowEnd = addDays(nextMonday, FRESHNESS_RETEST_CADENCE_DAYS);

  return [
    {
      id: `freshness-retest-${nextMonday.toISOString().slice(0, 10)}`,
      kind: "freshness_retest",
      title: `Stale control retest (${staleControlIds.length} controls)`,
      cadenceLabel: `Every ${FRESHNESS_RETEST_CADENCE_DAYS}d until fresh`,
      nextRunAt: now.toISOString(),
      windowStart: now.toISOString(),
      windowEnd: windowEnd.toISOString(),
      status: "due",
      controlCount: staleControlIds.length,
      controlIds: staleControlIds.slice(0, 50),
      framework: null,
      detail: "Re-run audit mappings and policy acceptance for controls past stale threshold",
      href: "/governance/compliance/evidence-freshness",
    },
  ];
}

export function buildScheduledBundleTesting(
  lastBundleCreatedAt: string | null,
  now = new Date(),
): ControlTestingSchedule[] {
  if (!lastBundleCreatedAt) {
    return [
      {
        id: "bundle-initial",
        kind: "scheduled_bundle",
        title: "Initial evidence bundle",
        cadenceLabel: `Every ${EVIDENCE_COLLECTION_CADENCE_DAYS}d`,
        nextRunAt: now.toISOString(),
        windowStart: now.toISOString(),
        windowEnd: addDays(now, 7).toISOString(),
        status: "due",
        controlCount: 0,
        controlIds: [],
        framework: null,
        detail: "No bundles on file — create first tamper-evident snapshot",
        href: "/governance/compliance/bundles",
      },
    ];
  }

  const last = new Date(lastBundleCreatedAt);
  const nextRun = addDays(last, EVIDENCE_COLLECTION_CADENCE_DAYS);
  const overdue = nextRun.getTime() < now.getTime();

  return [
    {
      id: `bundle-cadence-${nextRun.toISOString().slice(0, 10)}`,
      kind: "scheduled_bundle",
      title: "Recurring evidence bundle",
      cadenceLabel: `Every ${EVIDENCE_COLLECTION_CADENCE_DAYS}d`,
      nextRunAt: overdue ? now.toISOString() : nextRun.toISOString(),
      windowStart: addDays(nextRun, -3).toISOString(),
      windowEnd: addDays(nextRun, 3).toISOString(),
      status: overdue ? "overdue" : scheduleStatus(nextRun.toISOString(), addDays(nextRun, 3).toISOString(), now),
      controlCount: 0,
      controlIds: [],
      framework: null,
      detail: overdue
        ? `Last bundle ${lastBundleCreatedAt.slice(0, 10)} — collection overdue`
        : `Next bundle target ${nextRun.toISOString().slice(0, 10)}`,
      href: "/governance/compliance/bundles",
    },
  ];
}

export function mergeControlTestingSchedules(
  parts: ControlTestingSchedule[],
): ControlTestingSchedule[] {
  return [...parts].sort((a, b) => {
    const order = { overdue: 0, due: 1, upcoming: 2, completed: 3 };
    const sa = order[a.status] ?? 4;
    const sb = order[b.status] ?? 4;
    if (sa !== sb) return sa - sb;
    return new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime();
  });
}

export function buildControlTestingSchedulesPackFromParts(input: {
  orgId: string | null;
  horizonDays: number;
  schedules: ControlTestingSchedule[];
  generatedAt?: string;
}): ControlTestingSchedulesPack {
  const schedules = input.schedules;
  return {
    version: CONTROL_TESTING_SCHEDULES_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    schedules,
    dueCount: schedules.filter((s) => s.status === "due").length,
    upcomingCount: schedules.filter((s) => s.status === "upcoming").length,
    overdueCount: schedules.filter((s) => s.status === "overdue").length,
    attestationScheduleCount: schedules.filter((s) => s.kind === "attestation_evidence").length,
    checkpointScheduleCount: schedules.filter((s) => s.kind === "framework_checkpoint").length,
    freshnessRetestCount: schedules.filter((s) => s.kind === "freshness_retest").length,
    bundleScheduleCount: schedules.filter((s) => s.kind === "scheduled_bundle").length,
  };
}

export async function buildControlTestingSchedulesPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ControlTestingSchedulesPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? 90;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const now = new Date();
  const rangeEnd = addDays(now, horizonDays);

  const [attestations, bundles, freshness] = await Promise.all([
    listControlAttestationBoard(userId, opts.orgId, supabase),
    listEvidenceBundlesForOrg(opts.orgId, { limit: 5, supabase }),
    buildEvidenceFreshnessDashboard(userId, {
      orgId: opts.orgId,
      periodDays: 30,
      supabase,
    }),
  ]);

  const staleIds = (freshness?.staleQueue ?? []).map((r) => r.controlId);

  const schedules = mergeControlTestingSchedules([
    ...buildAttestationTestingSchedules(attestations, now),
    ...buildFrameworkCheckpointSchedules(now),
    ...buildFreshnessRetestSchedules(staleIds, now),
    ...buildScheduledBundleTesting(bundles[0]?.createdAt ?? null, now),
  ]).filter((s) => new Date(s.windowEnd).getTime() <= rangeEnd.getTime() || s.status !== "completed");

  return buildControlTestingSchedulesPackFromParts({
    orgId: opts.orgId,
    horizonDays,
    schedules,
  });
}

export function controlTestingSchedulesToCsv(pack: ControlTestingSchedulesPack): string {
  const header =
    "id,kind,title,cadence,next_run_at,window_start,window_end,status,control_count,framework,detail,href";
  const lines = pack.schedules.map((s) =>
    [
      s.id,
      s.kind,
      JSON.stringify(s.title),
      s.cadenceLabel,
      s.nextRunAt,
      s.windowStart,
      s.windowEnd,
      s.status,
      s.controlCount,
      s.framework ?? "",
      JSON.stringify(s.detail),
      s.href,
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}
