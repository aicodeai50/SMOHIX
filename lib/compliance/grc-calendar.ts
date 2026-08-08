import type { SupabaseClient } from "@supabase/supabase-js";

import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
import { BASELINE_COMPARISON_FRAMEWORKS, FRAMEWORK_CONSOLE_PATHS } from "@/lib/compliance/baseline-comparison";
import { listComplianceDigestDeliveries } from "@/lib/compliance/compliance-digest";
import { getComplianceSlaOrgSettings } from "@/lib/compliance/compliance-sla-reminders";
import { listEvidenceBundlesForOrg } from "@/lib/compliance/evidence-bundle";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { escapeCsvField } from "@/lib/audit/csv-escape";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listThirdPartyVendors } from "@/lib/third-party-risk/data";

export const GRC_CALENDAR_VERSION = "smohix-grc-calendar/1";

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  soc2: "SOC 2 Type II",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nist_csf: "NIST CSF",
  cis_v8: "CIS v8",
  cmmc_l2: "CMMC L2",
  gdpr_art32: "GDPR Art. 32",
};

export type GrcCalendarEventKind =
  | "attestation_due"
  | "vendor_review"
  | "evidence_bundle"
  | "assessment_checkpoint"
  | "scheduled_digest"
  | "scheduled_sla"
  | "recommended_bundle";

export type GrcCalendarEventStatus = "upcoming" | "overdue" | "completed" | "scheduled";

export type GrcCalendarEvent = {
  id: string;
  kind: GrcCalendarEventKind;
  startsAt: string;
  endsAt: string | null;
  title: string;
  detail: string;
  href: string;
  status: GrcCalendarEventStatus;
  dayKey: string;
};

export type GrcAuditSeason = {
  label: string;
  quarterEnd: string;
  daysUntilQuarterEnd: number;
  frameworkCount: number;
  periodDays: number;
};

export type GrcComplianceCalendarPack = {
  version: typeof GRC_CALENDAR_VERSION;
  generatedAt: string;
  orgId: string;
  horizonDays: number;
  rangeStart: string;
  rangeEnd: string;
  auditSeason: GrcAuditSeason;
  digestWebhookConfigured: boolean;
  slaRemindersEnabled: boolean;
  events: GrcCalendarEvent[];
  eventsByDay: Record<string, GrcCalendarEvent[]>;
  upcomingCount: number;
  overdueCount: number;
};

export function dayKeyFromIso(iso: string): string {
  return iso.slice(0, 10);
}

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

function nextMondayUtc(from = new Date()): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const day = d.getUTCDay();
  const add = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setUTCDate(d.getUTCDate() + add);
  d.setUTCHours(9, 0, 0, 0);
  return d;
}

function daysUntil(iso: string, now = new Date()): number {
  const target = new Date(iso).getTime();
  return Math.ceil((target - now.getTime()) / 86_400_000);
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function buildGrcCalendarFromEvents(input: {
  orgId: string;
  horizonDays: number;
  events: GrcCalendarEvent[];
  digestWebhookConfigured: boolean;
  slaRemindersEnabled: boolean;
  periodDays?: number;
  generatedAt?: string;
}): GrcComplianceCalendarPack {
  const now = new Date();
  const rangeStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const rangeEnd = addDays(rangeStart, input.horizonDays);
  const periodDays = input.periodDays ?? 30;

  const filtered = input.events
    .filter((e) => inRange(e.startsAt, rangeStart, rangeEnd))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const eventsByDay: Record<string, GrcCalendarEvent[]> = {};
  for (const e of filtered) {
    const key = e.dayKey;
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(e);
  }

  const quarterEnd = endOfUtcQuarter(now);
  const quarterLabel = `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`;

  return {
    version: GRC_CALENDAR_VERSION,
    generatedAt: input.generatedAt ?? now.toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    auditSeason: {
      label: quarterLabel,
      quarterEnd: quarterEnd.toISOString(),
      daysUntilQuarterEnd: daysUntil(quarterEnd.toISOString(), now),
      frameworkCount: BASELINE_COMPARISON_FRAMEWORKS.length,
      periodDays,
    },
    digestWebhookConfigured: input.digestWebhookConfigured,
    slaRemindersEnabled: input.slaRemindersEnabled,
    events: filtered,
    eventsByDay,
    upcomingCount: filtered.filter((e) => e.status === "upcoming" || e.status === "scheduled").length,
    overdueCount: filtered.filter((e) => e.status === "overdue").length,
  };
}

export async function collectGrcCalendarEvents(
  userId: string,
  orgId: string,
  supabase: SupabaseClient,
): Promise<{
  events: GrcCalendarEvent[];
  digestWebhookConfigured: boolean;
  slaRemindersEnabled: boolean;
}> {
  const events: GrcCalendarEvent[] = [];
  const now = new Date();

  const [attestations, vendors, bundles, digestDeliveries, slaSettings, orgRow] = await Promise.all([
    listControlAttestationBoard(userId, orgId, supabase),
    listThirdPartyVendors(userId, orgId, supabase),
    listEvidenceBundlesForOrg(orgId, { limit: 12, supabase }),
    listComplianceDigestDeliveries(orgId, { limit: 6, supabase }),
    getComplianceSlaOrgSettings(orgId, supabase),
    supabase
      .from("organizations")
      .select("compliance_digest_webhook_url")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  const digestWebhookConfigured = Boolean(
    String(orgRow.data?.compliance_digest_webhook_url ?? "").trim(),
  );

  for (const row of attestations) {
    const status: GrcCalendarEventStatus =
      row.status === "overdue" ? "overdue" : row.status === "attested" ? "completed" : "upcoming";
    events.push({
      id: `attestation-${row.id}`,
      kind: "attestation_due",
      startsAt: row.dueAt,
      endsAt: null,
      title: `Attestation: ${row.control.ref}`,
      detail: `${row.control.title}${row.ownerLabel ? ` · ${row.ownerLabel}` : ""}`,
      href: "/governance/compliance/attestations",
      status,
      dayKey: dayKeyFromIso(row.dueAt),
    });
  }

  for (const vendor of vendors) {
    if (!vendor.reviewDueAt) continue;
    const overdue = new Date(vendor.reviewDueAt).getTime() < now.getTime();
    events.push({
      id: `vendor-${vendor.id}`,
      kind: "vendor_review",
      startsAt: vendor.reviewDueAt,
      endsAt: null,
      title: `Vendor review: ${vendor.name}`,
      detail: `${vendor.riskTier} tier · ${vendor.category}`,
      href: "/governance/third-party-risk",
      status: overdue ? "overdue" : "upcoming",
      dayKey: dayKeyFromIso(vendor.reviewDueAt),
    });
  }

  for (const bundle of bundles) {
    events.push({
      id: `bundle-${bundle.id}`,
      kind: "evidence_bundle",
      startsAt: bundle.createdAt,
      endsAt: null,
      title: `Evidence bundle (${bundle.windowLabel})`,
      detail: `Manifest ${bundle.manifestSha256.slice(0, 12)}…`,
      href: "/governance/compliance/bundles",
      status: "completed",
      dayKey: dayKeyFromIso(bundle.createdAt),
    });
  }

  if (bundles.length > 0) {
    const last = bundles[0];
    const recommended = addDays(new Date(last.createdAt), 30);
    events.push({
      id: `bundle-recommended-${last.id}`,
      kind: "recommended_bundle",
      startsAt: recommended.toISOString(),
      endsAt: null,
      title: "Recommended evidence bundle",
      detail: "30 days after last bundle snapshot",
      href: "/governance/compliance/bundles",
      status: "scheduled",
      dayKey: dayKeyFromIso(recommended.toISOString()),
    });
  }

  const quarterEnd = endOfUtcQuarter(now);
  for (const fw of BASELINE_COMPARISON_FRAMEWORKS) {
    events.push({
      id: `assessment-${fw}-${dayKeyFromIso(quarterEnd.toISOString())}`,
      kind: "assessment_checkpoint",
      startsAt: quarterEnd.toISOString(),
      endsAt: null,
      title: `${FRAMEWORK_LABELS[fw]} checkpoint`,
      detail: `${quarterEnd.toISOString().slice(0, 10)} audit season close · ${30}d evidence window`,
      href: FRAMEWORK_CONSOLE_PATHS[fw],
      status: "upcoming",
      dayKey: dayKeyFromIso(quarterEnd.toISOString()),
    });
  }

  if (digestWebhookConfigured) {
    let nextDigest = nextMondayUtc(now);
    for (let i = 0; i < 14; i += 1) {
      events.push({
        id: `digest-${dayKeyFromIso(nextDigest.toISOString())}-${i}`,
        kind: "scheduled_digest",
        startsAt: nextDigest.toISOString(),
        endsAt: null,
        title: "Weekly compliance digest",
        detail: "Scheduled GRC webhook delivery",
        href: "/governance/compliance/digest",
        status: "scheduled",
        dayKey: dayKeyFromIso(nextDigest.toISOString()),
      });
      nextDigest = addDays(nextDigest, 7);
    }
  }

  if (slaSettings.enabled) {
    let nextSla = nextMondayUtc(addDays(now, 3));
    for (let i = 0; i < 12; i += 1) {
      events.push({
        id: `sla-${dayKeyFromIso(nextSla.toISOString())}-${i}`,
        kind: "scheduled_sla",
        startsAt: nextSla.toISOString(),
        endsAt: null,
        title: "SLA reminder cadence",
        detail: `Attestation due ${slaSettings.dueDaysBefore}d before · email ${slaSettings.emailEnabled ? "on" : "off"}`,
        href: "/governance/compliance/sla-reminders",
        status: "scheduled",
        dayKey: dayKeyFromIso(nextSla.toISOString()),
      });
      nextSla = addDays(nextSla, 7);
    }
  }

  for (const delivery of digestDeliveries) {
    events.push({
      id: `digest-sent-${delivery.id}`,
      kind: "scheduled_digest",
      startsAt: delivery.createdAt,
      endsAt: null,
      title: "Digest delivered",
      detail: delivery.deliveryStatus,
      href: "/governance/compliance/digest",
      status: "completed",
      dayKey: dayKeyFromIso(delivery.createdAt),
    });
  }

  return {
    events,
    digestWebhookConfigured,
    slaRemindersEnabled: slaSettings.enabled,
  };
}

export async function buildGrcComplianceCalendar(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<GrcComplianceCalendarPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? 90;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const collected = await collectGrcCalendarEvents(userId, opts.orgId, supabase);

  return buildGrcCalendarFromEvents({
    orgId: opts.orgId,
    horizonDays,
    periodDays: opts.periodDays,
    ...collected,
  });
}

export function grcCalendarToCsv(pack: GrcComplianceCalendarPack): string {
  const lines = [
    "day,kind,status,title,detail,href",
    ...pack.events.map((e) =>
      [
        e.dayKey,
        e.kind,
        e.status,
        escapeCsvField(e.title),
        escapeCsvField(e.detail),
        escapeCsvField(e.href),
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

export function monthGridForPack(
  pack: GrcComplianceCalendarPack,
  year: number,
  month: number,
): { weeks: (string | null)[][]; monthLabel: string } {
  const first = new Date(Date.UTC(year, month, 1));
  const last = new Date(Date.UTC(year, month + 1, 0));
  const monthLabel = first.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  const startPad = first.getUTCDay();
  const daysInMonth = last.getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return { weeks, monthLabel };
}
