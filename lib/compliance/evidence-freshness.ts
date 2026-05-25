import type { SupabaseClient } from "@supabase/supabase-js";

import { listAuditTimestampsForCompliance } from "@/lib/audit/data";
import {
  listAcceptedPolicyGuardrailsByPlaybook,
  type AcceptedPolicyGuardrails,
} from "@/lib/approvals/policy-suggestions";
import { COMPLIANCE_CONTROLS } from "@/lib/compliance/catalog";
import { complianceControlsForAuditEvent } from "@/lib/compliance/map-audit";
import {
  complianceControlsForAcceptedPolicy,
} from "@/lib/compliance/map-policy";
import { getComplianceCoverageSummary } from "@/lib/compliance/summary";
import type { ComplianceControl, ComplianceFramework } from "@/lib/compliance/types";
import { escapeCsvField } from "@/lib/audit/csv-escape";
import { auditEvidenceDeepLink } from "@/lib/compliance/attestation/evidence";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const EVIDENCE_FRESHNESS_VERSION = "zentro-evidence-freshness/1";

export const DEFAULT_STALE_DAYS = 30;
export const DEFAULT_AGING_DAYS = 14;
export const AUDIT_LOOKBACK_DAYS = 180;

export type EvidenceFreshnessBand = "fresh" | "aging" | "stale" | "none";

export type ControlEvidenceFreshnessRow = {
  controlId: string;
  framework: ComplianceFramework;
  ref: string;
  title: string;
  domain: string;
  coverageStatus30d: "covered" | "partial" | "none";
  auditEvidenceCount30d: number;
  policyEvidenceCount: number;
  lastAuditEvidenceAt: string | null;
  lastPolicyEvidenceAt: string | null;
  effectiveLastEvidenceAt: string | null;
  daysSinceEvidence: number | null;
  freshness: EvidenceFreshnessBand;
  auditEvidenceHref: string;
};

export type EvidenceFreshnessDashboard = {
  version: typeof EVIDENCE_FRESHNESS_VERSION;
  generatedAt: string;
  periodDays: number;
  staleDays: number;
  agingDays: number;
  orgId: string | null;
  auditEventsScanned: number;
  summary: {
    total: number;
    fresh: number;
    aging: number;
    stale: number;
    none: number;
  };
  byFramework: {
    framework: ComplianceFramework;
    label: string;
    fresh: number;
    aging: number;
    stale: number;
    none: number;
  }[];
  staleQueue: ControlEvidenceFreshnessRow[];
  rows: ControlEvidenceFreshnessRow[];
};

const FRAMEWORK_LABELS: Record<ComplianceFramework, string> = {
  soc2: "SOC 2",
  iso27001: "ISO 27001",
  pcidss: "PCI DSS",
  hipaa: "HIPAA",
  nist_csf: "NIST CSF 2.0",
  cis_v8: "CIS Controls v8",
  cmmc_l2: "CMMC L2",
  gdpr_art32: "GDPR Art. 32",
};

function sinceIsoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function daysBetween(iso: string, now = new Date()): number {
  const then = new Date(iso).getTime();
  return Math.floor((now.getTime() - then) / 86_400_000);
}

export function computeEvidenceFreshnessBand(input: {
  effectiveLastEvidenceAt: string | null;
  hasAnyEvidence30d: boolean;
  staleDays: number;
  agingDays: number;
  now?: Date;
}): EvidenceFreshnessBand {
  if (!input.effectiveLastEvidenceAt) {
    return input.hasAnyEvidence30d ? "stale" : "none";
  }
  const days = daysBetween(input.effectiveLastEvidenceAt, input.now);
  if (days <= input.agingDays) return "fresh";
  if (days <= input.staleDays) return "aging";
  return "stale";
}

function maxIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

async function latestAcceptedPolicyAt(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("policy_suggestions")
    .select("promoted_at, reviewed_at, created_at")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .order("promoted_at", { ascending: false, nullsFirst: false })
    .limit(50);

  let latest: string | null = null;
  for (const row of data ?? []) {
    const candidate =
      (row.promoted_at as string | null) ??
      (row.reviewed_at as string | null) ??
      (row.created_at as string | null);
    latest = maxIso(latest, candidate);
  }
  return latest;
}

function buildLastAuditMap(
  events: { event_type: string; created_at: string }[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const event of events) {
    const refs = complianceControlsForAuditEvent(event.event_type);
    for (const ref of refs) {
      const prev = map.get(ref.id);
      if (!prev || new Date(event.created_at).getTime() > new Date(prev).getTime()) {
        map.set(ref.id, event.created_at);
      }
    }
  }
  return map;
}

function buildPolicyLinkedControls(
  accepted: Record<string, AcceptedPolicyGuardrails>,
): Set<string> {
  const ids = new Set<string>();
  for (const guardrails of Object.values(accepted)) {
    for (const ref of complianceControlsForAcceptedPolicy(guardrails)) {
      ids.add(ref.id);
    }
  }
  return ids;
}

export function buildControlEvidenceFreshnessRow(input: {
  control: ComplianceControl;
  coverageStatus30d: "covered" | "partial" | "none";
  auditEvidenceCount30d: number;
  policyEvidenceCount: number;
  lastAuditEvidenceAt: string | null;
  lastPolicyEvidenceAt: string | null;
  staleDays: number;
  agingDays: number;
}): ControlEvidenceFreshnessRow {
  const policyLinked = input.policyEvidenceCount > 0;
  const effectiveLastEvidenceAt = maxIso(
    input.lastAuditEvidenceAt,
    policyLinked ? input.lastPolicyEvidenceAt : null,
  );
  const hasAnyEvidence30d =
    input.auditEvidenceCount30d > 0 || input.policyEvidenceCount > 0;
  const freshness = computeEvidenceFreshnessBand({
    effectiveLastEvidenceAt,
    hasAnyEvidence30d,
    staleDays: input.staleDays,
    agingDays: input.agingDays,
  });

  return {
    controlId: input.control.id,
    framework: input.control.framework,
    ref: input.control.ref,
    title: input.control.title,
    domain: input.control.domain,
    coverageStatus30d: input.coverageStatus30d,
    auditEvidenceCount30d: input.auditEvidenceCount30d,
    policyEvidenceCount: input.policyEvidenceCount,
    lastAuditEvidenceAt: input.lastAuditEvidenceAt,
    lastPolicyEvidenceAt: policyLinked ? input.lastPolicyEvidenceAt : null,
    effectiveLastEvidenceAt,
    daysSinceEvidence: effectiveLastEvidenceAt
      ? daysBetween(effectiveLastEvidenceAt)
      : null,
    freshness,
    auditEvidenceHref: auditEvidenceDeepLink(input.control.id),
  };
}

export async function buildEvidenceFreshnessDashboard(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    staleDays?: number;
    agingDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<EvidenceFreshnessDashboard | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const staleDays = opts.staleDays ?? DEFAULT_STALE_DAYS;
  const agingDays = opts.agingDays ?? DEFAULT_AGING_DAYS;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [summary, auditEvents, lastPolicyAt, accepted] = await Promise.all([
    getComplianceCoverageSummary(userId, {
      sinceIso: sinceIsoDaysAgo(periodDays),
      orgId: opts.orgId,
      supabase,
    }),
    listAuditTimestampsForCompliance(userId, {
      sinceIso: sinceIsoDaysAgo(AUDIT_LOOKBACK_DAYS),
      orgId: opts.orgId,
      supabase,
    }),
    latestAcceptedPolicyAt(supabase, userId),
    listAcceptedPolicyGuardrailsByPlaybook(supabase, userId),
  ]);

  const lastAuditByControl = buildLastAuditMap(auditEvents);
  const policyLinked = buildPolicyLinkedControls(accepted);
  const summaryById = new Map(summary.rows.map((r) => [r.control.id, r]));

  const rows: ControlEvidenceFreshnessRow[] = COMPLIANCE_CONTROLS.map((control) => {
    const cov = summaryById.get(control.id);
    const policyCount = cov?.policyEvidenceCount ?? 0;
    return buildControlEvidenceFreshnessRow({
      control,
      coverageStatus30d: cov?.status ?? "none",
      auditEvidenceCount30d: cov?.auditEvidenceCount ?? 0,
      policyEvidenceCount: policyCount,
      lastAuditEvidenceAt: lastAuditByControl.get(control.id) ?? null,
      lastPolicyEvidenceAt: policyLinked.has(control.id) ? lastPolicyAt : null,
      staleDays,
      agingDays,
    });
  });

  const summaryCounts = { total: rows.length, fresh: 0, aging: 0, stale: 0, none: 0 };
  for (const row of rows) {
    summaryCounts[row.freshness] += 1;
  }

  const frameworkKeys = [...new Set(rows.map((r) => r.framework))] as ComplianceFramework[];
  const byFramework = frameworkKeys.map((framework) => {
    const subset = rows.filter((r) => r.framework === framework);
    return {
      framework,
      label: FRAMEWORK_LABELS[framework],
      fresh: subset.filter((r) => r.freshness === "fresh").length,
      aging: subset.filter((r) => r.freshness === "aging").length,
      stale: subset.filter((r) => r.freshness === "stale").length,
      none: subset.filter((r) => r.freshness === "none").length,
    };
  });

  const staleQueue = rows
    .filter((r) => r.freshness === "stale" || r.freshness === "none")
    .sort((a, b) => (b.daysSinceEvidence ?? 9999) - (a.daysSinceEvidence ?? 9999));

  return {
    version: EVIDENCE_FRESHNESS_VERSION,
    generatedAt: new Date().toISOString(),
    periodDays,
    staleDays,
    agingDays,
    orgId: opts.orgId,
    auditEventsScanned: auditEvents.length,
    summary: summaryCounts,
    byFramework,
    staleQueue,
    rows,
  };
}

export function evidenceFreshnessToCsv(dashboard: EvidenceFreshnessDashboard): string {
  const headers = [
    "control_id",
    "framework",
    "control_ref",
    "title",
    "domain",
    "coverage_status_30d",
    "audit_count_30d",
    "policy_count",
    "last_audit_evidence_at",
    "last_policy_evidence_at",
    "effective_last_evidence_at",
    "days_since_evidence",
    "freshness",
  ];
  const lines = [headers.join(",")];
  for (const row of dashboard.rows) {
    lines.push(
      [
        row.controlId,
        row.framework,
        row.ref,
        row.title,
        row.domain,
        row.coverageStatus30d,
        row.auditEvidenceCount30d,
        row.policyEvidenceCount,
        row.lastAuditEvidenceAt ?? "",
        row.lastPolicyEvidenceAt ?? "",
        row.effectiveLastEvidenceAt ?? "",
        row.daysSinceEvidence ?? "",
        row.freshness,
      ]
        .map((v) => escapeCsvField(String(v)))
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}
