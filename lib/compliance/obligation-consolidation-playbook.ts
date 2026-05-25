import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { appendAuditEvent } from "@/lib/audit/append";
import { getPlaybookById } from "@/lib/automations/playbooks";
import {
  buildObligationCrossoverReportPack,
  type ObligationCrossoverCluster,
} from "@/lib/compliance/obligation-crossover-report";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { isRunbookSlugValid, runbookTitleForSlug } from "@/lib/runbooks/catalog";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const OBLIGATION_CONSOLIDATION_PLAYBOOK_VERSION =
  "zentro-obligation-consolidation-playbook/1";

export const DEFAULT_CONSOLIDATION_RUNBOOK_SLUG = "grc-evidence-sprint";

export type ConsolidationPlayStatus =
  | "planned"
  | "in_progress"
  | "collected"
  | "verified"
  | "dismissed";

export type ConsolidationPlaybookStep = {
  order: number;
  title: string;
  description: string;
  href: string | null;
  completed: boolean;
};

export type ConsolidationPlayRow = {
  id: string;
  orgId: string;
  clusterKey: string;
  clusterId: string;
  status: ConsolidationPlayStatus;
  runbookSlug: string;
  playbookId: string | null;
  frameworks: ComplianceFramework[];
  obligationCount: number;
  overdueCount: number;
  windowStart: string | null;
  windowEnd: string | null;
  evidenceNote: string | null;
  operatorNote: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type ConsolidationWorkflowItem = {
  clusterId: string;
  clusterKey: string;
  kind: ObligationCrossoverCluster["kind"];
  frameworks: ComplianceFramework[];
  frameworkLabels: string[];
  obligationCount: number;
  overdueCount: number;
  windowStart: string;
  windowEnd: string;
  controlRefs: string[];
  evidenceReuseNote: string;
  runbookSlug: string;
  runbookTitle: string;
  playbookId: string | null;
  playbookName: string | null;
  steps: ConsolidationPlaybookStep[];
  play: ConsolidationPlayRow | null;
};

export type ConsolidationPlaybookStats = {
  planned: number;
  inProgress: number;
  collected: number;
  verified: number;
  dismissed: number;
  tracked: number;
};

export type ObligationConsolidationPlaybookPack = {
  version: typeof OBLIGATION_CONSOLIDATION_PLAYBOOK_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  crossoverClusterCount: number;
  workflowCount: number;
  stats: ConsolidationPlaybookStats;
  workflows: ConsolidationWorkflowItem[];
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

export function clusterKeyFor(cluster: Pick<ObligationCrossoverCluster, "id" | "windowStart" | "frameworks">): string {
  const digest = createHash("sha256")
    .update(`${cluster.id}|${cluster.windowStart}|${cluster.frameworks.join("+")}`)
    .digest("hex")
    .slice(0, 16);
  return `crossover:${digest}`;
}

export function stepsCompletedForStatus(status: ConsolidationPlayStatus): number {
  switch (status) {
    case "planned":
      return 0;
    case "in_progress":
      return 2;
    case "collected":
      return 5;
    case "verified":
    case "dismissed":
      return 6;
    default:
      return 0;
  }
}

export function buildConsolidationPlaybookSteps(
  cluster: Pick<
    ObligationCrossoverCluster,
    "frameworks" | "obligationCount" | "controlRefs" | "evidenceReuseNote"
  >,
  status: ConsolidationPlayStatus,
): ConsolidationPlaybookStep[] {
  const doneThrough = stepsCompletedForStatus(status);
  const fw = cluster.frameworks.map((f) => FRAMEWORK_LABELS[f] ?? f).join(", ");
  const controls =
    cluster.controlRefs.length > 0 ? cluster.controlRefs.slice(0, 4).join(", ") : "linked controls";

  const steps: Omit<ConsolidationPlaybookStep, "completed">[] = [
    {
      order: 1,
      title: "Confirm crossover scope",
      description: `Review ${cluster.obligationCount} obligations across ${fw} — ${cluster.evidenceReuseNote}`,
      href: "/governance/compliance/obligation-crossover",
    },
    {
      order: 2,
      title: "Start evidence collection sprint",
      description: `Use one runbook pass for ${controls} instead of per-framework silos.`,
      href: "/runbooks/grc-evidence-sprint",
    },
    {
      order: 3,
      title: "Snapshot unified evidence bundle",
      description: "Export a single bundle window covering all frameworks in the cluster.",
      href: "/governance/compliance/bundles",
    },
    {
      order: 4,
      title: "Link automation test runs",
      description: "Attach dry-runs to controls in the shared crossover control set.",
      href: "/governance/compliance/testing-evidence-linker",
    },
    {
      order: 5,
      title: "Close assessor evidence requests",
      description: "Fulfill open document requests tied to cluster obligations.",
      href: "/governance/compliance/evidence-requests",
    },
    {
      order: 6,
      title: "Verify freshness and sign-off",
      description: "Refresh evidence freshness; attest controls once for all mapped frameworks.",
      href: "/governance/compliance/evidence-freshness",
    },
  ];

  return steps.map((s) => ({
    ...s,
    completed: s.order <= doneThrough,
  }));
}

export function suggestConsolidationRunbook(
  cluster: Pick<ObligationCrossoverCluster, "overdueCount" | "kind">,
): { runbookSlug: string; playbookId: string | null; rationale: string } {
  if (cluster.overdueCount > 0) {
    return {
      runbookSlug: DEFAULT_CONSOLIDATION_RUNBOOK_SLUG,
      playbookId: "pb-cache-flush",
      rationale: "Overdue crossover obligations — prioritize evidence sprint with cache flush to refresh stale artifacts.",
    };
  }
  if (cluster.kind === "shared_control") {
    return {
      runbookSlug: DEFAULT_CONSOLIDATION_RUNBOOK_SLUG,
      playbookId: null,
      rationale: "Cross-framework control link — collect once and map evidence to all linked packs.",
    };
  }
  return {
    runbookSlug: DEFAULT_CONSOLIDATION_RUNBOOK_SLUG,
    playbookId: null,
    rationale: "Aligned due window — merge collection into a single operator sprint.",
  };
}

function rowFromDb(raw: Record<string, unknown>): ConsolidationPlayRow {
  return {
    id: String(raw.id),
    orgId: String(raw.org_id),
    clusterKey: String(raw.cluster_key),
    clusterId: String(raw.cluster_id),
    status: raw.status as ConsolidationPlayStatus,
    runbookSlug: String(raw.runbook_slug),
    playbookId: raw.playbook_id ? String(raw.playbook_id) : null,
    frameworks: (raw.frameworks as string[]).map((f) => f as ComplianceFramework),
    obligationCount: Number(raw.obligation_count) || 0,
    overdueCount: Number(raw.overdue_count) || 0,
    windowStart: raw.window_start ? String(raw.window_start) : null,
    windowEnd: raw.window_end ? String(raw.window_end) : null,
    evidenceNote: raw.evidence_note ? String(raw.evidence_note) : null,
    operatorNote: raw.operator_note ? String(raw.operator_note) : null,
    createdAt: String(raw.created_at),
    updatedAt: String(raw.updated_at),
    completedAt: raw.completed_at ? String(raw.completed_at) : null,
  };
}

export async function listConsolidationPlays(
  orgId: string,
  supabase?: SupabaseClient,
): Promise<ConsolidationPlayRow[]> {
  const client = supabase ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from("compliance_obligation_consolidation_plays")
    .select(
      "id, org_id, cluster_key, cluster_id, status, runbook_slug, playbook_id, frameworks, obligation_count, overdue_count, window_start, window_end, evidence_note, operator_note, created_at, updated_at, completed_at",
    )
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => rowFromDb(row as Record<string, unknown>));
}

export function buildObligationConsolidationPlaybookFromParts(input: {
  orgId: string | null;
  horizonDays: number;
  clusters: ObligationCrossoverCluster[];
  plays: ConsolidationPlayRow[];
  generatedAt?: string;
}): ObligationConsolidationPlaybookPack {
  const playByKey = new Map(input.plays.map((p) => [p.clusterKey, p]));

  const workflows: ConsolidationWorkflowItem[] = input.clusters.map((cluster) => {
    const clusterKey = clusterKeyFor(cluster);
    const play = playByKey.get(clusterKey) ?? null;
    const suggestion = suggestConsolidationRunbook(cluster);
    const runbookSlug = play?.runbookSlug ?? suggestion.runbookSlug;
    const playbookId = play?.playbookId ?? suggestion.playbookId;
    const playbook = playbookId ? getPlaybookById(playbookId) : null;
    const status = play?.status ?? "planned";

    return {
      clusterId: cluster.id,
      clusterKey,
      kind: cluster.kind,
      frameworks: cluster.frameworks,
      frameworkLabels: cluster.frameworks.map((f) => FRAMEWORK_LABELS[f] ?? f),
      obligationCount: cluster.obligationCount,
      overdueCount: cluster.overdueCount,
      windowStart: cluster.windowStart,
      windowEnd: cluster.windowEnd,
      controlRefs: cluster.controlRefs,
      evidenceReuseNote: cluster.evidenceReuseNote,
      runbookSlug,
      runbookTitle: runbookTitleForSlug(runbookSlug) ?? runbookSlug,
      playbookId,
      playbookName: playbook?.name ?? null,
      steps: buildConsolidationPlaybookSteps(cluster, status),
      play,
    };
  });

  const stats: ConsolidationPlaybookStats = {
    planned: 0,
    inProgress: 0,
    collected: 0,
    verified: 0,
    dismissed: 0,
    tracked: input.plays.length,
  };
  for (const w of workflows) {
    const s = w.play?.status ?? "planned";
    if (s === "planned") stats.planned += 1;
    else if (s === "in_progress") stats.inProgress += 1;
    else if (s === "collected") stats.collected += 1;
    else if (s === "verified") stats.verified += 1;
    else if (s === "dismissed") stats.dismissed += 1;
  }

  return {
    version: OBLIGATION_CONSOLIDATION_PLAYBOOK_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    crossoverClusterCount: input.clusters.length,
    workflowCount: workflows.length,
    stats,
    workflows,
  };
}

export async function buildObligationConsolidationPlaybookPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ObligationConsolidationPlaybookPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? 90;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [crossover, plays] = await Promise.all([
    buildObligationCrossoverReportPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    listConsolidationPlays(opts.orgId, supabase),
  ]);

  if (!crossover) return null;

  return buildObligationConsolidationPlaybookFromParts({
    orgId: opts.orgId,
    horizonDays,
    clusters: crossover.clusters,
    plays,
  });
}

export async function startConsolidationPlay(
  userId: string,
  orgId: string,
  cluster: ObligationCrossoverCluster,
  opts?: { runbookSlug?: string; playbookId?: string | null; supabase?: SupabaseClient },
): Promise<{ ok: true; play: ConsolidationPlayRow } | { ok: false; error: string }> {
  const supabase = opts?.supabase ?? (await createServerSupabaseClient());
  const clusterKey = clusterKeyFor(cluster);
  const suggestion = suggestConsolidationRunbook(cluster);
  const runbookSlug = opts?.runbookSlug ?? suggestion.runbookSlug;
  if (!isRunbookSlugValid(runbookSlug)) {
    return { ok: false, error: "Invalid runbook slug." };
  }

  const { data: existing } = await supabase
    .from("compliance_obligation_consolidation_plays")
    .select("id")
    .eq("org_id", orgId)
    .eq("cluster_key", clusterKey)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "Consolidation play already tracked for this cluster." };
  }

  const { data, error } = await supabase
    .from("compliance_obligation_consolidation_plays")
    .insert({
      org_id: orgId,
      cluster_key: clusterKey,
      cluster_id: cluster.id,
      status: "in_progress",
      runbook_slug: runbookSlug,
      playbook_id: opts?.playbookId ?? suggestion.playbookId,
      frameworks: cluster.frameworks,
      obligation_count: cluster.obligationCount,
      overdue_count: cluster.overdueCount,
      window_start: cluster.windowStart,
      window_end: cluster.windowEnd,
      evidence_note: cluster.evidenceReuseNote,
      created_by: userId,
      updated_by: userId,
    })
    .select(
      "id, org_id, cluster_key, cluster_id, status, runbook_slug, playbook_id, frameworks, obligation_count, overdue_count, window_start, window_end, evidence_note, operator_note, created_at, updated_at, completed_at",
    )
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed." };
  }

  const play = rowFromDb(data as Record<string, unknown>);

  await appendAuditEvent({
    event_type: "governance.obligation_consolidation_play_started",
    user_id: userId,
    org_id: orgId,
    details: {
      cluster_key: clusterKey,
      cluster_id: cluster.id,
      frameworks: cluster.frameworks,
      obligation_count: cluster.obligationCount,
      runbook_slug: runbookSlug,
    },
  });

  return { ok: true, play };
}

export async function updateConsolidationPlayStatus(
  userId: string,
  orgId: string,
  playId: string,
  status: ConsolidationPlayStatus,
  opts?: { operatorNote?: string; supabase?: SupabaseClient },
): Promise<boolean> {
  const supabase = opts?.supabase ?? (await createServerSupabaseClient());
  const completedAt =
    status === "verified" || status === "dismissed" ? new Date().toISOString() : null;

  const patch: Record<string, unknown> = {
    status,
    updated_by: userId,
    updated_at: new Date().toISOString(),
    completed_at: completedAt,
  };
  if (opts?.operatorNote !== undefined) {
    patch.operator_note = opts.operatorNote;
  }

  const { data, error } = await supabase
    .from("compliance_obligation_consolidation_plays")
    .update(patch)
    .eq("id", playId)
    .eq("org_id", orgId)
    .select("cluster_key, cluster_id, frameworks, obligation_count")
    .maybeSingle();

  if (error || !data) return false;

  await appendAuditEvent({
    event_type: "governance.obligation_consolidation_play_updated",
    user_id: userId,
    org_id: orgId,
    details: {
      play_id: playId,
      status,
      cluster_key: data.cluster_key,
      cluster_id: data.cluster_id,
    },
  });

  return true;
}

export function obligationConsolidationPlaybookToCsv(
  pack: ObligationConsolidationPlaybookPack,
): string {
  const lines = [
    "cluster_key,frameworks,obligations,overdue,status,runbook,steps_completed",
    ...pack.workflows.map((w) => {
      const completed = w.steps.filter((s) => s.completed).length;
      const status = w.play?.status ?? "planned";
      return [
        w.clusterKey,
        JSON.stringify(w.frameworks.join("+")),
        w.obligationCount,
        w.overdueCount,
        status,
        w.runbookSlug,
        completed,
      ].join(",");
    }),
  ];
  return `${lines.join("\n")}\n`;
}
