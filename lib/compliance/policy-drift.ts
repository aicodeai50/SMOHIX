import type { SupabaseClient } from "@supabase/supabase-js";

import {
  aggregateAcceptedPolicyGuardrails,
  type AcceptedPolicyGuardrails,
} from "@/lib/approvals/policy-suggestions";
import { BASELINE_COMPARISON_FRAMEWORKS } from "@/lib/compliance/baseline-comparison";
import { buildContinuousAssessmentReport } from "@/lib/compliance/continuous-assessment";
import { complianceControlsForAcceptedPolicy } from "@/lib/compliance/map-policy";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const POLICY_DRIFT_VERSION = "smohix-policy-drift/1";

export type PolicyDriftSeverity = "high" | "medium" | "low";

export type PolicyDriftKind =
  | "missing_dry_run_fresh"
  | "missing_change_window"
  | "missing_blast_radius"
  | "uncovered_control_gap"
  | "stale_acceptance"
  | "guardrail_text_mismatch";

export type ControlGuardrailExpectation = {
  requireDryRunFresh?: boolean;
  requireChangeWindow?: boolean;
  requireBlastRadius?: boolean;
};

/** Controls that typically require automation guardrail evidence when mapped by accepted policies. */
export const CONTROL_GUARDRAIL_EXPECTATIONS: Record<string, ControlGuardrailExpectation> = {
  "soc2:CC8.1": { requireDryRunFresh: true, requireChangeWindow: true },
  "iso:A.8.25": { requireDryRunFresh: true },
  "pcidss:6.3.1": { requireDryRunFresh: true },
  "soc2:CC7.2": { requireBlastRadius: true },
  "iso:A.8.16": { requireBlastRadius: true },
  "pcidss:11.5.1": { requireBlastRadius: true },
  "soc2:CC7.3": { requireBlastRadius: true },
  "nist_csf:DE.CM-01": { requireBlastRadius: true },
  "cis_v8:8.2": { requireBlastRadius: true },
  "cmmc_l2:3.3.1": { requireBlastRadius: true },
};

export type AcceptedPolicySnapshot = {
  playbookId: string;
  guardrails: AcceptedPolicyGuardrails;
  latestAcceptedAt: string | null;
  mappedControlIds: string[];
};

export type PolicyDriftFinding = {
  id: string;
  playbookId: string;
  severity: PolicyDriftSeverity;
  kind: PolicyDriftKind;
  title: string;
  detail: string;
  controlIds: string[];
  framework: string | null;
  acceptedAt: string | null;
  href: string;
};

export type PolicyDriftPack = {
  version: typeof POLICY_DRIFT_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string;
  acceptedPolicyCount: number;
  assessmentGapCount: number;
  findings: PolicyDriftFinding[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
};

type AssessmentGap = {
  fullControlId: string;
  framework: string;
  controlRef: string;
  title: string;
  reason: string;
};

function kindTitle(kind: PolicyDriftKind): string {
  switch (kind) {
    case "missing_dry_run_fresh":
      return "Missing dry-run freshness guardrail";
    case "missing_change_window":
      return "Missing change-window guardrail";
    case "missing_blast_radius":
      return "Missing blast-radius scope";
    case "uncovered_control_gap":
      return "Assessment gap without policy coverage";
    case "stale_acceptance":
      return "Stale accepted policy vs regressed control";
    case "guardrail_text_mismatch":
      return "Guardrail text not reflected in enforcement";
  }
}

function severityForKind(kind: PolicyDriftKind): PolicyDriftSeverity {
  if (kind === "uncovered_control_gap" || kind === "missing_dry_run_fresh") return "high";
  if (kind === "stale_acceptance" || kind === "missing_change_window") return "medium";
  return "low";
}

function daysSince(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

export function guardrailDriftKindsForControl(
  controlId: string,
  guardrails: AcceptedPolicyGuardrails,
): PolicyDriftKind[] {
  const exp = CONTROL_GUARDRAIL_EXPECTATIONS[controlId];
  if (!exp) return [];
  const kinds: PolicyDriftKind[] = [];
  if (exp.requireDryRunFresh && !guardrails.requireDryRunFresh) {
    kinds.push("missing_dry_run_fresh");
  }
  if (exp.requireChangeWindow && !guardrails.requireChangeWindow) {
    kinds.push("missing_change_window");
  }
  if (exp.requireBlastRadius && !guardrails.maxBlastRadius) {
    kinds.push("missing_blast_radius");
  }
  return kinds;
}

export function buildAcceptedPolicySnapshots(
  accepted: Record<string, AcceptedPolicyGuardrails>,
  acceptedAtByPlaybook: Record<string, string | null>,
): AcceptedPolicySnapshot[] {
  return Object.values(accepted).map((guardrails) => ({
    playbookId: guardrails.playbookId,
    guardrails,
    latestAcceptedAt: acceptedAtByPlaybook[guardrails.playbookId] ?? null,
    mappedControlIds: complianceControlsForAcceptedPolicy(guardrails).map((c) => c.id),
  }));
}

export function buildControlToPlaybookIndex(
  snapshots: AcceptedPolicySnapshot[],
): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const snap of snapshots) {
    for (const controlId of snap.mappedControlIds) {
      const list = index.get(controlId) ?? [];
      if (!list.includes(snap.playbookId)) list.push(snap.playbookId);
      index.set(controlId, list);
    }
  }
  return index;
}

export function detectGuardrailTextMismatch(
  playbookId: string,
  aggregated: AcceptedPolicyGuardrails,
  rawGuardrailLines: string[],
  acceptedAt: string | null,
): PolicyDriftFinding | null {
  const text = rawGuardrailLines.join(" ").toLowerCase();
  const mentionsDryRun = text.includes("dry-run") || text.includes("dry run");
  const mentionsChangeWindow = text.includes("change window");
  const mentionsBlast = text.includes("blast");

  if (mentionsDryRun && !aggregated.requireDryRunFresh) {
    return {
      id: `${playbookId}:guardrail_text_mismatch:dry_run`,
      playbookId,
      severity: "medium",
      kind: "guardrail_text_mismatch",
      title: kindTitle("guardrail_text_mismatch"),
      detail:
        "Accepted suggestion text references dry-run freshness but aggregated guardrails do not enforce requireDryRunFresh.",
      controlIds: [],
      framework: null,
      acceptedAt,
      href: "/governance/policies",
    };
  }
  if (mentionsChangeWindow && !aggregated.requireChangeWindow) {
    return {
      id: `${playbookId}:guardrail_text_mismatch:change_window`,
      playbookId,
      severity: "medium",
      kind: "guardrail_text_mismatch",
      title: kindTitle("guardrail_text_mismatch"),
      detail:
        "Accepted suggestion text references change windows but aggregated guardrails do not enforce requireChangeWindow.",
      controlIds: [],
      framework: null,
      acceptedAt,
      href: "/governance/policies",
    };
  }
  if (mentionsBlast && !aggregated.maxBlastRadius) {
    return {
      id: `${playbookId}:guardrail_text_mismatch:blast`,
      playbookId,
      severity: "low",
      kind: "guardrail_text_mismatch",
      title: kindTitle("guardrail_text_mismatch"),
      detail:
        "Accepted suggestion text references blast radius but no maxBlastRadius scope is configured.",
      controlIds: [],
      framework: null,
      acceptedAt,
      href: "/governance/policies",
    };
  }
  return null;
}

export function buildPolicyDriftFindings(input: {
  snapshots: AcceptedPolicySnapshot[];
  gaps: AssessmentGap[];
  rawGuardrailsByPlaybook: Record<string, string[]>;
  staleAcceptanceDays?: number;
}): PolicyDriftFinding[] {
  const findings: PolicyDriftFinding[] = [];
  const index = buildControlToPlaybookIndex(input.snapshots);
  const staleDays = input.staleAcceptanceDays ?? 120;

  for (const gap of input.gaps) {
    const playbooks = index.get(gap.fullControlId) ?? [];
    if (playbooks.length === 0) {
      findings.push({
        id: `gap:${gap.fullControlId}:uncovered`,
        playbookId: "—",
        severity: "high",
        kind: "uncovered_control_gap",
        title: kindTitle("uncovered_control_gap"),
        detail: `${gap.reason} No accepted automation policy maps this control.`,
        controlIds: [gap.fullControlId],
        framework: gap.framework,
        acceptedAt: null,
        href: "/governance/policies",
      });
      continue;
    }

    for (const playbookId of playbooks) {
      const snap = input.snapshots.find((s) => s.playbookId === playbookId);
      if (!snap) continue;

      for (const kind of guardrailDriftKindsForControl(gap.fullControlId, snap.guardrails)) {
        findings.push({
          id: `${playbookId}:${gap.fullControlId}:${kind}`,
          playbookId,
          severity: severityForKind(kind),
          kind,
          title: kindTitle(kind),
          detail: `Assessment gap on ${gap.controlRef}: ${gap.reason}`,
          controlIds: [gap.fullControlId],
          framework: gap.framework,
          acceptedAt: snap.latestAcceptedAt,
          href: "/governance/policies",
        });
      }

      if (
        gap.reason.toLowerCase().includes("regressed") &&
        snap.latestAcceptedAt &&
        (daysSince(snap.latestAcceptedAt) ?? 0) >= staleDays
      ) {
        findings.push({
          id: `${playbookId}:${gap.fullControlId}:stale`,
          playbookId,
          severity: "medium",
          kind: "stale_acceptance",
          title: kindTitle("stale_acceptance"),
          detail: `Policy accepted ${daysSince(snap.latestAcceptedAt)}d ago but control ${gap.controlRef} regressed in the current monitoring window.`,
          controlIds: [gap.fullControlId],
          framework: gap.framework,
          acceptedAt: snap.latestAcceptedAt,
          href: "/governance/policies",
        });
      }
    }
  }

  for (const snap of input.snapshots) {
    const raw = input.rawGuardrailsByPlaybook[snap.playbookId] ?? [];
    const mismatch = detectGuardrailTextMismatch(
      snap.playbookId,
      snap.guardrails,
      raw,
      snap.latestAcceptedAt,
    );
    if (mismatch) findings.push(mismatch);
  }

  const seen = new Set<string>();
  return findings.filter((f) => {
    if (seen.has(f.id)) return false;
    seen.add(f.id);
    return true;
  });
}

export function buildPolicyDriftPackFromFindings(input: {
  orgId: string;
  periodDays: number;
  acceptedPolicyCount: number;
  assessmentGapCount: number;
  findings: PolicyDriftFinding[];
  generatedAt?: string;
}): PolicyDriftPack {
  const highCount = input.findings.filter((f) => f.severity === "high").length;
  const mediumCount = input.findings.filter((f) => f.severity === "medium").length;
  const lowCount = input.findings.filter((f) => f.severity === "low").length;

  return {
    version: POLICY_DRIFT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    acceptedPolicyCount: input.acceptedPolicyCount,
    assessmentGapCount: input.assessmentGapCount,
    findings: input.findings.sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.severity] - rank[b.severity] || a.playbookId.localeCompare(b.playbookId);
    }),
    highCount,
    mediumCount,
    lowCount,
  };
}

export async function collectPolicyDriftInputs(
  userId: string,
  orgId: string,
  periodDays: number,
  supabase: SupabaseClient,
): Promise<{
  snapshots: AcceptedPolicySnapshot[];
  gaps: AssessmentGap[];
  rawGuardrailsByPlaybook: Record<string, string[]>;
  acceptedPolicyCount: number;
}> {
  const { data: acceptedRows } = await supabase
    .from("policy_suggestions")
    .select(
      "id, playbook_id, suggestion_key, guardrails_json, reviewer_notes, promoted_at, reviewed_at, created_at",
    )
    .eq("user_id", userId)
    .eq("status", "accepted")
    .limit(200);

  const rows = acceptedRows ?? [];
  const accepted = aggregateAcceptedPolicyGuardrails(
    rows as {
      id: unknown;
      playbook_id: unknown;
      suggestion_key: unknown;
      guardrails_json: unknown;
      reviewer_notes: unknown;
    }[],
  );

  const acceptedAtByPlaybook: Record<string, string | null> = {};
  const rawGuardrailsByPlaybook: Record<string, string[]> = {};

  for (const row of rows) {
    const playbookId = String(row.playbook_id ?? "");
    if (!playbookId) continue;
    const at =
      (row.promoted_at as string | null) ??
      (row.reviewed_at as string | null) ??
      (row.created_at as string | null);
    if (!at) continue;
    const prev = acceptedAtByPlaybook[playbookId];
    if (!prev || new Date(at).getTime() > new Date(prev).getTime()) {
      acceptedAtByPlaybook[playbookId] = at;
    }
    const lines = Array.isArray(row.guardrails_json)
      ? (row.guardrails_json as string[])
      : [];
    rawGuardrailsByPlaybook[playbookId] = [
      ...(rawGuardrailsByPlaybook[playbookId] ?? []),
      ...lines,
    ];
  }

  const snapshots = buildAcceptedPolicySnapshots(accepted, acceptedAtByPlaybook);

  const reports = await Promise.all(
    BASELINE_COMPARISON_FRAMEWORKS.map((framework) =>
      buildContinuousAssessmentReport(userId, {
        framework,
        orgId,
        periodDays,
        supabase,
      }),
    ),
  );

  const gaps: AssessmentGap[] = [];
  for (const report of reports) {
    if (!report) continue;
    for (const ex of report.exceptions) {
      const fullControlId = `${report.framework}:${ex.controlRef}`;
      gaps.push({
        fullControlId,
        framework: report.framework,
        controlRef: ex.controlRef,
        title: ex.title,
        reason: ex.reason,
      });
    }
  }

  return {
    snapshots,
    gaps,
    rawGuardrailsByPlaybook,
    acceptedPolicyCount: snapshots.length,
  };
}

export async function buildPolicyDriftPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<PolicyDriftPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const collected = await collectPolicyDriftInputs(userId, opts.orgId, periodDays, supabase);
  const findings = buildPolicyDriftFindings({
    snapshots: collected.snapshots,
    gaps: collected.gaps,
    rawGuardrailsByPlaybook: collected.rawGuardrailsByPlaybook,
  });

  return buildPolicyDriftPackFromFindings({
    orgId: opts.orgId,
    periodDays,
    acceptedPolicyCount: collected.acceptedPolicyCount,
    assessmentGapCount: collected.gaps.length,
    findings,
  });
}

export function policyDriftToCsv(pack: PolicyDriftPack): string {
  const header = "playbook_id,severity,kind,title,control_ids,detail,accepted_at";
  const lines = pack.findings.map((f) =>
    [
      f.playbookId,
      f.severity,
      f.kind,
      JSON.stringify(f.title),
      JSON.stringify(f.controlIds.join(";")),
      JSON.stringify(f.detail),
      f.acceptedAt ?? "",
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}
