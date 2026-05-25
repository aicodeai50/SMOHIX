import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import { getPlaybookById } from "@/lib/automations/playbooks";
import { buildComplianceProgramDashboard, type ProgramGapRow } from "@/lib/compliance/program-dashboard";
import { isRunbookSlugValid, runbookTitleForSlug } from "@/lib/runbooks/catalog";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type GapRemediationStatus = "open" | "in_progress" | "resolved" | "dismissed";

export type ComplianceGapRunbookSuggestion = {
  runbookSlug: string;
  runbookTitle: string;
  playbookId: string | null;
  playbookName: string | null;
  rationale: string;
};

export type ComplianceGapRemediationRow = {
  id: string;
  gapKey: string;
  framework: ProgramGapRow["framework"];
  controlRef: string;
  title: string;
  reason: string;
  runbookSlug: string;
  playbookId: string | null;
  status: GapRemediationStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

export type ComplianceGapRunbookQueueItem = ProgramGapRow & {
  gapKey: string;
  suggestion: ComplianceGapRunbookSuggestion;
  remediation: ComplianceGapRemediationRow | null;
};

export type ComplianceGapRemediationStats = {
  open: number;
  inProgress: number;
  resolved: number;
  dismissed: number;
  tracked: number;
};

export function gapKeyFor(gap: Pick<ProgramGapRow, "framework" | "controlRef" | "reason">): string {
  const digest = createHash("sha256")
    .update(`${gap.framework}|${gap.controlRef}|${gap.reason}`)
    .digest("hex")
    .slice(0, 16);
  return `${gap.framework}:${gap.controlRef}:${digest}`;
}

export function suggestRemediationForGap(gap: ProgramGapRow): ComplianceGapRunbookSuggestion {
  const blob = `${gap.reason} ${gap.title} ${gap.controlRef}`.toLowerCase();

  if (/database|backup|recovery|replicat|failover|rto|rpo/.test(blob)) {
    return pack("db-failover", "pb-restart-workers", "Database resilience gaps map to failover drill and worker restart.");
  }
  if (/tls|cert|encrypt|crypto|mTLS/.test(blob)) {
    return pack("cert-rotation", null, "Cryptographic control gaps map to certificate rotation runbook.");
  }
  if (/latency|availability|incident|monitor|alert|5xx|error.?rate/.test(blob)) {
    return pack("api-latency", "pb-scale-api", "Monitoring and availability gaps map to latency response and API scale.");
  }
  if (/access|mfa|auth|identity|privileged|iam|login/.test(blob)) {
    return pack("grc-access-review", "pb-restart-workers", "Access and identity gaps map to access review runbook.");
  }
  if (/policy|guardrail|automation|change|approval/.test(blob)) {
    return pack("grc-change-hardening", "pb-cache-flush", "Policy and change-control gaps map to guardrail hardening.");
  }
  if (/evidence|audit|log|attest|document/.test(blob)) {
    return pack("grc-evidence-sprint", null, "Evidence collection gaps map to an evidence sprint runbook.");
  }

  return pack("grc-evidence-sprint", "pb-cache-flush", "Default remediation: evidence sprint plus cache flush playbook.");
}

function pack(
  runbookSlug: string,
  playbookId: string | null,
  rationale: string,
): ComplianceGapRunbookSuggestion {
  const playbook = playbookId ? getPlaybookById(playbookId) : null;
  return {
    runbookSlug,
    runbookTitle: runbookTitleForSlug(runbookSlug) ?? runbookSlug,
    playbookId,
    playbookName: playbook?.name ?? null,
    rationale,
  };
}

export async function listComplianceGapRemediations(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<ComplianceGapRemediationRow[]> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_gap_remediations")
    .select(
      "id, gap_key, framework, control_ref, title, reason, runbook_slug, playbook_id, status, created_at, updated_at, resolved_at",
    )
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: String(row.id),
    gapKey: String(row.gap_key),
    framework: row.framework as ProgramGapRow["framework"],
    controlRef: String(row.control_ref),
    title: String(row.title),
    reason: String(row.reason),
    runbookSlug: String(row.runbook_slug),
    playbookId: row.playbook_id ? String(row.playbook_id) : null,
    status: row.status as GapRemediationStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
  }));
}

export function summarizeGapRemediationStats(
  rows: ComplianceGapRemediationRow[],
): ComplianceGapRemediationStats {
  const open = rows.filter((r) => r.status === "open").length;
  const inProgress = rows.filter((r) => r.status === "in_progress").length;
  const resolved = rows.filter((r) => r.status === "resolved").length;
  const dismissed = rows.filter((r) => r.status === "dismissed").length;
  return {
    open,
    inProgress,
    resolved,
    dismissed,
    tracked: rows.length,
  };
}

export async function buildComplianceGapRunbookQueue(
  userId: string,
  orgId: string,
  opts?: { periodDays?: number; supabase?: SupabaseClient },
): Promise<{
  generatedAt: string;
  periodDays: number;
  gaps: ComplianceGapRunbookQueueItem[];
  stats: ComplianceGapRemediationStats;
} | null> {
  if (!hasSupabaseAuth() || !userId || !orgId) return null;

  const periodDays = opts?.periodDays ?? 30;
  const supabase = opts?.supabase ?? (await createServerSupabaseClient());

  const dashboard = await buildComplianceProgramDashboard(userId, {
    orgId,
    periodDays,
    supabase,
  });
  if (!dashboard) return null;

  const remediations = await listComplianceGapRemediations(orgId, supabase);
  const byGapKey = new Map(remediations.map((r) => [r.gapKey, r]));

  const gapByKey = new Map<string, ProgramGapRow>();
  for (const gap of dashboard.topGaps) {
    gapByKey.set(gapKeyFor(gap), gap);
  }
  for (const row of remediations) {
    if (!gapByKey.has(row.gapKey)) {
      gapByKey.set(row.gapKey, {
        framework: row.framework,
        controlRef: row.controlRef,
        title: row.title,
        reason: row.reason,
      });
    }
  }

  const gaps: ComplianceGapRunbookQueueItem[] = [...gapByKey.entries()].map(([key, gap]) => {
    const suggestion = suggestRemediationForGap(gap);
    return {
      ...gap,
      gapKey: key,
      suggestion,
      remediation: byGapKey.get(key) ?? null,
    };
  });

  gaps.sort((a, b) => {
    const rank = (s: GapRemediationStatus | "untracked") => {
      if (s === "untracked") return 0;
      if (s === "open") return 1;
      if (s === "in_progress") return 2;
      if (s === "resolved") return 4;
      return 3;
    };
    const sa = a.remediation?.status ?? "untracked";
    const sb = b.remediation?.status ?? "untracked";
    return rank(sa) - rank(sb) || a.framework.localeCompare(b.framework);
  });

  return {
    generatedAt: new Date().toISOString(),
    periodDays,
    gaps,
    stats: summarizeGapRemediationStats(remediations),
  };
}

export async function startGapRemediation(
  userId: string,
  orgId: string,
  gap: ProgramGapRow,
  input: { runbookSlug?: string; playbookId?: string | null },
  supabase?: SupabaseClient,
): Promise<{ ok: true; row: ComplianceGapRemediationRow } | { ok: false; error: string }> {
  const client = supabase ?? (await createServerSupabaseClient());
  const key = gapKeyFor(gap);
  const suggestion = suggestRemediationForGap(gap);
  const runbookSlug = (input.runbookSlug ?? suggestion.runbookSlug).trim();
  if (!isRunbookSlugValid(runbookSlug)) {
    return { ok: false, error: "invalid_runbook" };
  }
  const playbookId = input.playbookId ?? suggestion.playbookId;
  if (playbookId && !getPlaybookById(playbookId)) {
    return { ok: false, error: "invalid_playbook" };
  }

  const { data, error } = await client
    .from("compliance_gap_remediations")
    .upsert(
      {
        org_id: orgId,
        gap_key: key,
        framework: gap.framework,
        control_ref: gap.controlRef,
        title: gap.title,
        reason: gap.reason,
        runbook_slug: runbookSlug,
        playbook_id: playbookId,
        status: "open",
        created_by: userId,
        resolved_by: null,
        resolved_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,gap_key" },
    )
    .select(
      "id, gap_key, framework, control_ref, title, reason, runbook_slug, playbook_id, status, created_at, updated_at, resolved_at",
    )
    .single();

  if (error || !data) return { ok: false, error: "upsert_failed" };

  await appendAuditEvent({
    event_type: "governance.compliance_gap_remediation_started",
    user_id: userId,
    org_id: orgId,
    details: {
      gap_key: key,
      framework: gap.framework,
      control_ref: gap.controlRef,
      runbook_slug: runbookSlug,
      playbook_id: playbookId,
    },
  });

  return {
    ok: true,
    row: {
      id: String(data.id),
      gapKey: String(data.gap_key),
      framework: data.framework as ProgramGapRow["framework"],
      controlRef: String(data.control_ref),
      title: String(data.title),
      reason: String(data.reason),
      runbookSlug: String(data.runbook_slug),
      playbookId: data.playbook_id ? String(data.playbook_id) : null,
      status: data.status as GapRemediationStatus,
      createdAt: String(data.created_at),
      updatedAt: String(data.updated_at),
      resolvedAt: data.resolved_at ? String(data.resolved_at) : null,
    },
  };
}

export async function updateGapRemediationStatus(
  userId: string,
  orgId: string,
  remediationId: string,
  status: GapRemediationStatus,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const client = supabase ?? (await createServerSupabaseClient());
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "resolved") {
    patch.resolved_at = new Date().toISOString();
    patch.resolved_by = userId;
  } else if (status === "open" || status === "in_progress") {
    patch.resolved_at = null;
    patch.resolved_by = null;
  }

  const { data, error } = await client
    .from("compliance_gap_remediations")
    .update(patch)
    .eq("id", remediationId)
    .eq("org_id", orgId)
    .select("id, gap_key, framework, control_ref, runbook_slug")
    .maybeSingle();

  if (error || !data) return false;

  if (status === "resolved") {
    await appendAuditEvent({
      event_type: "governance.compliance_gap_remediation_resolved",
      user_id: userId,
      org_id: orgId,
      details: {
        remediation_id: remediationId,
        gap_key: data.gap_key,
        framework: data.framework,
        control_ref: data.control_ref,
        runbook_slug: data.runbook_slug,
      },
    });
  }

  return true;
}

export function frameworkLabel(framework: ProgramGapRow["framework"]): string {
  const labels: Record<ProgramGapRow["framework"], string> = {
    soc2: "SOC 2",
    iso27001: "ISO 27001",
    pcidss: "PCI DSS",
    hipaa: "HIPAA",
    nist_csf: "NIST CSF",
    cis_v8: "CIS v8",
    cmmc_l2: "CMMC L2",
    gdpr_art32: "GDPR Art. 32",
  };
  return labels[framework] ?? framework;
}
