import type { SupabaseClient } from "@supabase/supabase-js";

import { getLatestDryRunForIncident } from "@/lib/automations/dry-runs-db";
import { getLatestAuditWhisperForIncident } from "@/lib/audit/whispers";
import type { IncidentDetail } from "@/lib/incidents/types";
import { getIncidentTimeline } from "@/lib/incidents/timeline";

export type RcaHypothesis = {
  summary: string;
  likelyCause: string;
  recommendedActions: string[];
};

export type RcaEvidenceRef = {
  type: "timeline" | "dry_run" | "audit_whisper" | "incident";
  label: string;
};

export type IncidentRcaRun = {
  id: string;
  hypothesis: RcaHypothesis;
  confidenceScore: number;
  evidenceRefs: RcaEvidenceRef[];
  createdAt: string;
};

function clampConfidence(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function summarizeTimelineSignal(labels: string[]): string {
  const joined = labels.join(" ").toLowerCase();
  if (joined.includes("status")) return "status volatility during investigation";
  if (joined.includes("approval")) return "approval or guardrail friction";
  if (joined.includes("dry-run")) return "dry-run or execution readiness signal";
  return "operational timeline signal";
}

export async function createIncidentRcaRun(params: {
  supabase: SupabaseClient;
  userId: string;
  incident: IncidentDetail;
}): Promise<IncidentRcaRun | null> {
  const { supabase, userId, incident } = params;
  const [timeline, latestDryRun, latestWhisper] = await Promise.all([
    getIncidentTimeline({
      source: "database",
      userId,
      incidentId: incident.id,
      devTenantKey: null,
    }),
    getLatestDryRunForIncident(supabase, userId, incident.id),
    getLatestAuditWhisperForIncident(userId, incident.id),
  ]);

  const timelineLabels = timeline.slice(0, 5).map((entry) => entry.label);
  const timelineSignal = summarizeTimelineSignal(timelineLabels);
  const likelyCause = latestWhisper?.summary?.trim()
    ? latestWhisper.summary.trim()
    : `Primary driver appears to be ${timelineSignal}.`;

  const recommendedActions: string[] = [];
  if (!latestDryRun) {
    recommendedActions.push("Run a fresh dry-run linked to this incident before execution.");
  }
  if (!incident.runbookSlug) {
    recommendedActions.push("Attach a runbook so responders can follow a standard procedure.");
  }
  if (incident.status !== "resolved") {
    recommendedActions.push("Confirm owner and next action window before changing status.");
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push("Capture post-incident notes and verify prevention controls.");
  }

  const confidenceBase = 45;
  const confidence =
    confidenceBase +
    (latestWhisper ? 20 : 0) +
    (latestDryRun ? 15 : 0) +
    Math.min(20, timeline.length * 3);

  const evidenceRefs: RcaEvidenceRef[] = [
    { type: "incident", label: `${incident.id} · ${incident.title}` },
    ...timelineLabels.slice(0, 3).map((label) => ({ type: "timeline" as const, label })),
  ];
  if (latestDryRun) {
    evidenceRefs.push({
      type: "dry_run",
      label: `${latestDryRun.playbookId} · ${latestDryRun.ok ? "pass" : "fail"} · ${new Date(latestDryRun.at).toLocaleString()}`,
    });
  }
  if (latestWhisper?.summary) {
    evidenceRefs.push({ type: "audit_whisper", label: latestWhisper.summary });
  }

  const hypothesis: RcaHypothesis = {
    summary: `Likely root-cause pattern detected for ${incident.title}.`,
    likelyCause,
    recommendedActions,
  };

  const { data, error } = await supabase
    .from("incident_rca_runs")
    .insert({
      user_id: userId,
      incident_id: incident.id,
      hypothesis_json: hypothesis,
      confidence_score: clampConfidence(confidence),
      evidence_refs_json: evidenceRefs,
    })
    .select("id, hypothesis_json, confidence_score, evidence_refs_json, created_at")
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    hypothesis: row.hypothesis_json as RcaHypothesis,
    confidenceScore: Number(row.confidence_score) || 0,
    evidenceRefs: Array.isArray(row.evidence_refs_json)
      ? (row.evidence_refs_json as RcaEvidenceRef[])
      : [],
    createdAt: String(row.created_at),
  };
}

export async function getLatestIncidentRcaRun(
  supabase: SupabaseClient,
  userId: string,
  incidentId: string,
): Promise<IncidentRcaRun | null> {
  const { data, error } = await supabase
    .from("incident_rca_runs")
    .select("id, hypothesis_json, confidence_score, evidence_refs_json, created_at")
    .eq("user_id", userId)
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    hypothesis: row.hypothesis_json as RcaHypothesis,
    confidenceScore: Number(row.confidence_score) || 0,
    evidenceRefs: Array.isArray(row.evidence_refs_json)
      ? (row.evidence_refs_json as RcaEvidenceRef[])
      : [],
    createdAt: String(row.created_at),
  };
}
