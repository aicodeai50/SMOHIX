import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BASELINE_COMPARISON_FRAMEWORKS,
  FRAMEWORK_CONSOLE_PATHS,
} from "@/lib/compliance/baseline-comparison";
import {
  evidenceRequestToIcsObligation,
  grcCalendarEventToIcsObligation,
  testingScheduleToIcsObligation,
} from "@/lib/compliance/compliance-obligation-ics";
import { listAssessorEvidenceRequests } from "@/lib/compliance/assessor-evidence-requests";
import {
  buildControlTestingSchedulesPack,
  type ControlTestingScheduleKind,
} from "@/lib/compliance/control-testing-schedules";
import {
  heatLevelBgClass,
  riskScoreToLevel,
  type RiskHeatLevel,
} from "@/lib/compliance/compliance-risk-heatmap";
import { buildGrcComplianceCalendar } from "@/lib/compliance/grc-calendar";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { getSiteUrl } from "@/lib/site";
import type { VendorRiskTier } from "@/lib/third-party-risk/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const REGULATORY_OBLIGATION_HEATMAP_VERSION = "smohix-regulatory-obligation-heatmap/1";

export type ObligationDimension = "framework" | "vendor" | "testing" | "attestation" | "assessor";

export type ObligationUrgency = "overdue" | "due_soon" | "upcoming";

export type RegulatoryObligationItem = {
  id: string;
  dimension: ObligationDimension;
  bucketKey: string;
  bucketLabel: string;
  title: string;
  dueAt: string;
  urgency: ObligationUrgency;
  statusLabel: string;
  href: string;
  framework: ComplianceFramework | null;
  vendorTier: VendorRiskTier | null;
  testingKind: ControlTestingScheduleKind | null;
};

export type ObligationHeatmapCell = {
  key: string;
  label: string;
  dimension: ObligationDimension;
  openCount: number;
  overdueCount: number;
  dueSoonCount: number;
  upcomingCount: number;
  intensityScore: number;
  level: RiskHeatLevel;
  href: string;
};

export type ObligationStatusColumnCell = {
  urgency: ObligationUrgency;
  label: string;
  count: number;
  level: RiskHeatLevel;
};

export type RegulatoryObligationHeatmapPack = {
  version: typeof REGULATORY_OBLIGATION_HEATMAP_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  totalOpen: number;
  totalOverdue: number;
  totalDueSoon: number;
  frameworkGrid: ObligationHeatmapCell[];
  vendorTierGrid: ObligationHeatmapCell[];
  testingKindGrid: ObligationHeatmapCell[];
  statusColumns: ObligationStatusColumnCell[];
  topObligations: RegulatoryObligationItem[];
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

const FRAMEWORK_ORDER: ComplianceFramework[] = [...BASELINE_COMPARISON_FRAMEWORKS];

const VENDOR_TIER_ORDER: VendorRiskTier[] = ["critical", "high", "medium", "low"];

const TESTING_KIND_ORDER: ControlTestingScheduleKind[] = [
  "attestation_evidence",
  "framework_checkpoint",
  "freshness_retest",
  "scheduled_bundle",
];

const TESTING_KIND_LABELS: Record<ControlTestingScheduleKind, string> = {
  attestation_evidence: "Attestation evidence",
  framework_checkpoint: "Framework checkpoint",
  freshness_retest: "Freshness retest",
  scheduled_bundle: "Evidence bundle cadence",
};

export { heatLevelBgClass };

export function daysUntil(iso: string, now = new Date()): number {
  return Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
}

export function classifyObligationUrgency(dueAtIso: string, now = new Date()): ObligationUrgency {
  const days = daysUntil(dueAtIso, now);
  if (days < 0) return "overdue";
  if (days <= 7) return "due_soon";
  return "upcoming";
}

export function obligationIntensityScore(input: {
  overdue: number;
  dueSoon: number;
  upcoming: number;
}): number {
  const score = Math.min(
    100,
    input.overdue * 18 + input.dueSoon * 10 + input.upcoming * 4,
  );
  return Math.round(score);
}

function itemFromCalendarEvent(
  event: Parameters<typeof grcCalendarEventToIcsObligation>[0],
  siteUrl: string,
  now: Date,
): RegulatoryObligationItem | null {
  const mapped = grcCalendarEventToIcsObligation(event, siteUrl);
  if (!mapped) return null;

  let dimension: ObligationDimension = "attestation";
  let bucketKey = "attestation";
  let bucketLabel = "Attestations";
  let framework: ComplianceFramework | null = null;
  let vendorTier: VendorRiskTier | null = null;

  if (event.kind === "vendor_review") {
    dimension = "vendor";
    bucketKey = "vendor";
    bucketLabel = "Vendor reviews";
    const tierMatch = event.detail.match(/^(critical|high|medium|low) tier/i);
    vendorTier = (tierMatch?.[1] as VendorRiskTier) ?? "medium";
  } else if (event.kind === "assessment_checkpoint") {
    dimension = "framework";
    const fwMatch = event.id.match(/^assessment-([a-z0-9_]+)-/);
    if (fwMatch && fwMatch[1] in FRAMEWORK_LABELS) {
      framework = fwMatch[1] as ComplianceFramework;
      bucketKey = framework;
      bucketLabel = FRAMEWORK_LABELS[framework];
    } else {
      bucketKey = "checkpoint";
      bucketLabel = "Framework checkpoints";
    }
  } else if (event.kind === "recommended_bundle" || event.kind === "evidence_bundle") {
    dimension = "testing";
    bucketKey = "scheduled_bundle";
    bucketLabel = "Bundle cadence";
  }

  return {
    id: mapped.id,
    dimension,
    bucketKey,
    bucketLabel,
    title: mapped.title,
    dueAt: mapped.startsAt,
    urgency: classifyObligationUrgency(mapped.startsAt, now),
    statusLabel: mapped.statusLabel,
    href: mapped.href.replace(siteUrl, ""),
    framework,
    vendorTier,
    testingKind: event.kind === "recommended_bundle" ? "scheduled_bundle" : null,
  };
}

export function collectRegulatoryObligationItems(input: {
  calendar: Awaited<ReturnType<typeof buildGrcComplianceCalendar>> | null;
  testing: Awaited<ReturnType<typeof buildControlTestingSchedulesPack>> | null;
  evidenceRequests: Awaited<ReturnType<typeof listAssessorEvidenceRequests>>;
  horizonDays: number;
  siteUrl?: string;
  now?: Date;
}): RegulatoryObligationItem[] {
  const siteUrl = input.siteUrl ?? getSiteUrl();
  const now = input.now ?? new Date();
  const horizonEnd = now.getTime() + input.horizonDays * 86_400_000;
  const items: RegulatoryObligationItem[] = [];

  if (input.calendar) {
    for (const event of input.calendar.events) {
      if (new Date(event.startsAt).getTime() > horizonEnd) continue;
      const item = itemFromCalendarEvent(event, siteUrl, now);
      if (item) items.push(item);
    }
  }

  if (input.testing) {
    for (const schedule of input.testing.schedules) {
      if (schedule.status === "completed") continue;
      if (new Date(schedule.windowEnd).getTime() < now.getTime() - 86_400_000) continue;
      const mapped = testingScheduleToIcsObligation(schedule, siteUrl);
      if (!mapped) continue;
      items.push({
        id: mapped.id,
        dimension: "testing",
        bucketKey: schedule.kind,
        bucketLabel: TESTING_KIND_LABELS[schedule.kind],
        title: mapped.title,
        dueAt: schedule.nextRunAt,
        urgency: schedule.status === "overdue" ? "overdue" : classifyObligationUrgency(schedule.nextRunAt, now),
        statusLabel: schedule.status,
        href: schedule.href,
        framework: schedule.framework,
        vendorTier: null,
        testingKind: schedule.kind,
      });
    }
  }

  for (const req of input.evidenceRequests) {
    if (req.status === "fulfilled" || req.status === "cancelled") continue;
    const mapped = evidenceRequestToIcsObligation(
      {
        id: req.id,
        title: req.title,
        description: req.description,
        dueAt: req.dueAt,
        frameworkLabel: req.frameworkLabel,
        controlRef: req.controlRef,
        status: req.status,
        href: "/governance/compliance/evidence-requests",
      },
      siteUrl,
    );
    items.push({
      id: mapped.id,
      dimension: "assessor",
      bucketKey: req.framework,
      bucketLabel: req.frameworkLabel,
      title: mapped.title,
      dueAt: req.dueAt,
      urgency: req.status === "overdue" ? "overdue" : classifyObligationUrgency(req.dueAt, now),
      statusLabel: req.status,
      href: "/governance/compliance/evidence-requests",
      framework: req.framework,
      vendorTier: null,
      testingKind: null,
    });
  }

  return items.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

function aggregateCells(
  items: RegulatoryObligationItem[],
  dimension: ObligationDimension,
  keys: { key: string; label: string; href: string; filter: (i: RegulatoryObligationItem) => boolean }[],
): ObligationHeatmapCell[] {
  return keys.map(({ key, label, href, filter }) => {
    const bucket = items.filter(filter);
    const overdue = bucket.filter((i) => i.urgency === "overdue").length;
    const dueSoon = bucket.filter((i) => i.urgency === "due_soon").length;
    const upcoming = bucket.filter((i) => i.urgency === "upcoming").length;
    const intensityScore = obligationIntensityScore({ overdue, dueSoon, upcoming });
    return {
      key,
      label,
      dimension,
      openCount: bucket.length,
      overdueCount: overdue,
      dueSoonCount: dueSoon,
      upcomingCount: upcoming,
      intensityScore,
      level: riskScoreToLevel(intensityScore),
      href,
    };
  });
}

export function buildRegulatoryObligationHeatmapFromItems(input: {
  orgId: string | null;
  horizonDays: number;
  items: RegulatoryObligationItem[];
  generatedAt?: string;
}): RegulatoryObligationHeatmapPack {
  const items = input.items;

  const frameworkGrid = aggregateCells(
    items,
    "framework",
    FRAMEWORK_ORDER.map((fw) => ({
      key: fw,
      label: FRAMEWORK_LABELS[fw],
      href: FRAMEWORK_CONSOLE_PATHS[fw],
      filter: (i) =>
        i.framework === fw ||
        (i.dimension === "assessor" && i.framework === fw) ||
        (i.dimension === "testing" && i.framework === fw),
    })),
  );

  const vendorTierGrid = aggregateCells(
    items,
    "vendor",
    VENDOR_TIER_ORDER.map((tier) => ({
      key: tier,
      label: `${tier.charAt(0).toUpperCase()}${tier.slice(1)} tier`,
      href: "/governance/third-party-risk",
      filter: (i) => i.dimension === "vendor" && i.vendorTier === tier,
    })),
  );

  const testingKindGrid = aggregateCells(
    items,
    "testing",
    TESTING_KIND_ORDER.map((kind) => ({
      key: kind,
      label: TESTING_KIND_LABELS[kind],
      href: "/governance/compliance/testing-schedules",
      filter: (i) => i.dimension === "testing" && i.testingKind === kind,
    })),
  );

  const totalOverdue = items.filter((i) => i.urgency === "overdue").length;
  const totalDueSoon = items.filter((i) => i.urgency === "due_soon").length;

  const statusColumns: ObligationStatusColumnCell[] = (
    ["overdue", "due_soon", "upcoming"] as ObligationUrgency[]
  ).map((urgency) => {
    const count = items.filter((i) => i.urgency === urgency).length;
    const intensity = obligationIntensityScore({
      overdue: urgency === "overdue" ? count : 0,
      dueSoon: urgency === "due_soon" ? count : 0,
      upcoming: urgency === "upcoming" ? count : 0,
    });
    return {
      urgency,
      label: urgency === "overdue" ? "Overdue" : urgency === "due_soon" ? "Due ≤7d" : "Upcoming",
      count,
      level: riskScoreToLevel(intensity),
    };
  });

  return {
    version: REGULATORY_OBLIGATION_HEATMAP_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    totalOpen: items.length,
    totalOverdue,
    totalDueSoon,
    frameworkGrid,
    vendorTierGrid,
    testingKindGrid,
    statusColumns,
    topObligations: [...items]
      .sort((a, b) => {
        const rank = { overdue: 0, due_soon: 1, upcoming: 2 };
        return rank[a.urgency] - rank[b.urgency] || a.dueAt.localeCompare(b.dueAt);
      })
      .slice(0, 20),
  };
}

export async function buildRegulatoryObligationHeatmapPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<RegulatoryObligationHeatmapPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? 90;
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

  return buildRegulatoryObligationHeatmapFromItems({
    orgId: opts.orgId,
    horizonDays,
    items,
  });
}

export function regulatoryObligationHeatmapToCsv(pack: RegulatoryObligationHeatmapPack): string {
  const lines = [
    "dimension,key,label,open,overdue,due_soon,upcoming,intensity,level",
    ...pack.frameworkGrid.map((c) =>
      ["framework", c.key, JSON.stringify(c.label), c.openCount, c.overdueCount, c.dueSoonCount, c.upcomingCount, c.intensityScore, c.level].join(","),
    ),
    ...pack.vendorTierGrid.map((c) =>
      ["vendor", c.key, JSON.stringify(c.label), c.openCount, c.overdueCount, c.dueSoonCount, c.upcomingCount, c.intensityScore, c.level].join(","),
    ),
    ...pack.testingKindGrid.map((c) =>
      ["testing", c.key, JSON.stringify(c.label), c.openCount, c.overdueCount, c.dueSoonCount, c.upcomingCount, c.intensityScore, c.level].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
