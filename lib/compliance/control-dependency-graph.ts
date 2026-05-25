import type { SupabaseClient } from "@supabase/supabase-js";

import { listAcceptedPolicyGuardrailsByPlaybook } from "@/lib/approvals/policy-suggestions";
import { listAuditEventTypesForCompliance } from "@/lib/audit/data";
import { COMPLIANCE_CONTROLS, getComplianceControl } from "@/lib/compliance/catalog";
import { complianceControlsForAcceptedPolicy } from "@/lib/compliance/map-policy";
import { complianceControlsForAuditEvent } from "@/lib/compliance/map-audit";
import { SOC2_ISO_CROSSWALK_LINKS } from "@/lib/compliance/soc2-iso-crosswalk";
import { getComplianceCoverageSummary } from "@/lib/compliance/summary";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const CONTROL_DEPENDENCY_GRAPH_VERSION = "zentro-control-dependency-graph/1";

export type ControlGraphEdgeKind = "crosswalk" | "shared_audit" | "shared_policy" | "thematic";

export type ControlGraphEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  sourceFramework: ComplianceFramework;
  targetFramework: ComplianceFramework;
  kind: ControlGraphEdgeKind;
  weight: number;
  label: string;
  crossFramework: boolean;
};

export type ControlGraphNode = {
  controlId: string;
  framework: ComplianceFramework;
  ref: string;
  title: string;
  domain: string;
  status: "covered" | "partial" | "none";
  auditEvidenceCount: number;
  policyEvidenceCount: number;
  degree: number;
};

export type FrameworkPairSummary = {
  frameworkA: ComplianceFramework;
  frameworkB: ComplianceFramework;
  edgeCount: number;
};

export type ControlDependencyGraphPack = {
  version: typeof CONTROL_DEPENDENCY_GRAPH_VERSION;
  generatedAt: string;
  periodDays: number;
  orgId: string | null;
  auditEventsScanned: number;
  acceptedPolicyCount: number;
  nodes: ControlGraphNode[];
  edges: ControlGraphEdge[];
  hubControlIds: string[];
  crossFrameworkEdgeCount: number;
  sharedAuditEdgeCount: number;
  sharedPolicyEdgeCount: number;
  crosswalkEdgeCount: number;
  thematicEdgeCount: number;
  frameworkPairs: FrameworkPairSummary[];
};

/** Thematic bridges between representative controls across framework packs. */
export const THEMATIC_CONTROL_DEPENDENCY_LINKS: {
  controlA: string;
  controlB: string;
  theme: string;
}[] = [
  { controlA: "soc2:CC6.1", controlB: "pcidss:8.3.1", theme: "identity_access" },
  { controlA: "soc2:CC6.1", controlB: "hipaa:164.312a1", theme: "identity_access" },
  { controlA: "soc2:CC6.1", controlB: "nist_csf:PR.AA-01", theme: "identity_access" },
  { controlA: "soc2:CC6.1", controlB: "cmmc_l2:3.1.1", theme: "identity_access" },
  { controlA: "soc2:CC6.1", controlB: "cis_v8:6.1", theme: "identity_access" },
  { controlA: "soc2:CC7.2", controlB: "pcidss:10.2.1", theme: "monitoring_logging" },
  { controlA: "soc2:CC7.2", controlB: "hipaa:164.312b", theme: "monitoring_logging" },
  { controlA: "soc2:CC7.2", controlB: "nist_csf:DE.CM-01", theme: "monitoring_logging" },
  { controlA: "soc2:CC7.2", controlB: "cmmc_l2:3.3.1", theme: "monitoring_logging" },
  { controlA: "soc2:CC7.2", controlB: "cis_v8:8.2", theme: "monitoring_logging" },
  { controlA: "soc2:CC7.3", controlB: "hipaa:164.308a6", theme: "incident_response" },
  { controlA: "soc2:CC7.3", controlB: "nist_csf:RS.MA-01", theme: "incident_response" },
  { controlA: "soc2:CC7.3", controlB: "cmmc_l2:3.6.1", theme: "incident_response" },
  { controlA: "soc2:CC7.3", controlB: "cis_v8:17.1", theme: "incident_response" },
  { controlA: "soc2:CC8.1", controlB: "pcidss:6.3.1", theme: "change_vulnerability" },
  { controlA: "soc2:CC8.1", controlB: "iso:A.8.25", theme: "change_sdlc" },
  { controlA: "soc2:CC8.1", controlB: "cmmc_l2:3.4.2", theme: "configuration" },
  { controlA: "soc2:CC5.3", controlB: "nist_csf:GV.PO-01", theme: "governance_policy" },
  { controlA: "soc2:CC5.3", controlB: "gdpr_art32:32-i2", theme: "governance_policy" },
  { controlA: "pcidss:4.2.1", controlB: "gdpr_art32:32-a2", theme: "encryption" },
  { controlA: "pcidss:4.2.1", controlB: "hipaa:164.312e1", theme: "encryption_transit" },
  { controlA: "nist_csf:ID.RA-01", controlB: "pcidss:6.3.1", theme: "vulnerability" },
  { controlA: "nist_csf:ID.RA-01", controlB: "cmmc_l2:3.11.2", theme: "vulnerability" },
  { controlA: "nist_csf:ID.RA-01", controlB: "cis_v8:11.2", theme: "vulnerability" },
  { controlA: "pcidss:11.5.1", controlB: "cmmc_l2:3.14.2", theme: "malware_ids" },
  { controlA: "hipaa:164.308b1", controlB: "gdpr_art32:32-b1", theme: "vendor_processing" },
];

function edgeKey(a: string, b: string, kind: ControlGraphEdgeKind): string {
  const [s, t] = a < b ? [a, b] : [b, a];
  return `${kind}::${s}::${t}`;
}

function parseEdgeKey(key: string): { sourceId: string; targetId: string } {
  const parts = key.split("::");
  if (parts.length < 3) {
    return { sourceId: "", targetId: "" };
  }
  return { sourceId: parts[1] ?? "", targetId: parts[2] ?? "" };
}

function frameworkOf(controlId: string): ComplianceFramework {
  const colon = controlId.indexOf(":");
  return (colon > 0 ? controlId.slice(0, colon) : "soc2") as ComplianceFramework;
}

export function buildCrosswalkEdges(): ControlGraphEdge[] {
  const edges: ControlGraphEdge[] = [];
  for (const link of SOC2_ISO_CROSSWALK_LINKS) {
    const sourceId = link.soc2Id;
    const targetId = link.isoId;
    edges.push({
      id: edgeKey(sourceId, targetId, "crosswalk"),
      sourceId,
      targetId,
      sourceFramework: frameworkOf(sourceId),
      targetFramework: frameworkOf(targetId),
      kind: "crosswalk",
      weight: link.strength === "primary" ? 3 : 2,
      label: link.mappingNote,
      crossFramework: true,
    });
  }
  return edges;
}

export function buildThematicEdges(): ControlGraphEdge[] {
  const edges: ControlGraphEdge[] = [];
  for (const link of THEMATIC_CONTROL_DEPENDENCY_LINKS) {
    if (!getComplianceControl(link.controlA) || !getComplianceControl(link.controlB)) continue;
    const sourceId = link.controlA;
    const targetId = link.controlB;
    edges.push({
      id: edgeKey(sourceId, targetId, "thematic"),
      sourceId,
      targetId,
      sourceFramework: frameworkOf(sourceId),
      targetFramework: frameworkOf(targetId),
      kind: "thematic",
      weight: 2,
      label: `Thematic: ${link.theme.replace(/_/g, " ")}`,
      crossFramework: sourceId.split(":")[0] !== targetId.split(":")[0],
    });
  }
  return edges;
}

export function buildSharedAuditEdgesFromEventTypes(
  events: { event_type: string }[],
): ControlGraphEdge[] {
  const byType = new Map<string, number>();
  for (const row of events) {
    const t = String(row.event_type ?? "").trim();
    if (!t) continue;
    byType.set(t, (byType.get(t) ?? 0) + 1);
  }

  const pairWeight = new Map<string, { weight: number; label: string }>();

  for (const [eventType, count] of byType) {
    const controls = complianceControlsForAuditEvent(eventType).map((c) => c.id);
    if (controls.length < 2) continue;
    for (let i = 0; i < controls.length; i += 1) {
      for (let j = i + 1; j < controls.length; j += 1) {
        const a = controls[i];
        const b = controls[j];
        const key = edgeKey(a, b, "shared_audit");
        const prev = pairWeight.get(key);
        const label = `Shared audit: ${eventType} (${count} events)`;
        pairWeight.set(key, {
          weight: (prev?.weight ?? 0) + count,
          label: prev ? `${prev.label}; ${eventType}` : label,
        });
      }
    }
  }

  const edges: ControlGraphEdge[] = [];
  for (const [key, meta] of pairWeight) {
    const { sourceId, targetId } = parseEdgeKey(key);
    if (!sourceId || !targetId) continue;
    edges.push({
      id: key,
      sourceId,
      targetId,
      sourceFramework: frameworkOf(sourceId),
      targetFramework: frameworkOf(targetId),
      kind: "shared_audit",
      weight: meta.weight,
      label: meta.label.slice(0, 120),
      crossFramework: frameworkOf(sourceId) !== frameworkOf(targetId),
    });
  }
  return edges.sort((a, b) => b.weight - a.weight);
}

export function buildSharedPolicyEdges(
  accepted: Record<string, import("@/lib/approvals/policy-suggestions").AcceptedPolicyGuardrails>,
): ControlGraphEdge[] {
  const pairPlaybooks = new Map<string, { weight: number; playbookId: string }>();

  for (const guardrails of Object.values(accepted)) {
    const controls = complianceControlsForAcceptedPolicy(guardrails).map((c) => c.id);
    if (controls.length < 2) continue;
    for (let i = 0; i < controls.length; i += 1) {
      for (let j = i + 1; j < controls.length; j += 1) {
        const a = controls[i];
        const b = controls[j];
        const key = edgeKey(a, b, "shared_policy");
        pairPlaybooks.set(key, {
          weight: (pairPlaybooks.get(key)?.weight ?? 0) + 1,
          playbookId: guardrails.playbookId,
        });
      }
    }
  }

  const edges: ControlGraphEdge[] = [];
  for (const [key, meta] of pairPlaybooks) {
    const { sourceId, targetId } = parseEdgeKey(key);
    if (!sourceId || !targetId) continue;
    edges.push({
      id: key,
      sourceId,
      targetId,
      sourceFramework: frameworkOf(sourceId),
      targetFramework: frameworkOf(targetId),
      kind: "shared_policy",
      weight: meta.weight,
      label: `Shared policy: ${meta.playbookId}`,
      crossFramework: frameworkOf(sourceId) !== frameworkOf(targetId),
    });
  }
  return edges;
}

export function mergeControlGraphEdges(sources: ControlGraphEdge[]): ControlGraphEdge[] {
  const merged = new Map<string, ControlGraphEdge>();
  for (const edge of sources) {
    const existing = merged.get(edge.id);
    if (!existing || edge.weight > existing.weight) {
      merged.set(edge.id, edge);
    }
  }
  return [...merged.values()];
}

export function buildControlGraphNodes(
  coverageByControl: Map<
    string,
    {
      status: "covered" | "partial" | "none";
      auditEvidenceCount: number;
      policyEvidenceCount: number;
    }
  >,
  edges: ControlGraphEdge[],
): ControlGraphNode[] {
  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.sourceId, (degree.get(e.sourceId) ?? 0) + 1);
    degree.set(e.targetId, (degree.get(e.targetId) ?? 0) + 1);
  }

  return COMPLIANCE_CONTROLS.map((control) => {
    const cov = coverageByControl.get(control.id) ?? {
      status: "none" as const,
      auditEvidenceCount: 0,
      policyEvidenceCount: 0,
    };
    return {
      controlId: control.id,
      framework: control.framework,
      ref: control.ref,
      title: control.title,
      domain: control.domain,
      status: cov.status,
      auditEvidenceCount: cov.auditEvidenceCount,
      policyEvidenceCount: cov.policyEvidenceCount,
      degree: degree.get(control.id) ?? 0,
    };
  });
}

export function summarizeFrameworkPairs(edges: ControlGraphEdge[]): FrameworkPairSummary[] {
  const counts = new Map<string, number>();
  for (const e of edges) {
    if (!e.crossFramework) continue;
    const fa = e.sourceFramework;
    const fb = e.targetFramework;
    const key = fa < fb ? `${fa}|${fb}` : `${fb}|${fa}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, edgeCount]) => {
      const [frameworkA, frameworkB] = key.split("|") as [ComplianceFramework, ComplianceFramework];
      return { frameworkA, frameworkB, edgeCount };
    })
    .sort((a, b) => b.edgeCount - a.edgeCount);
}

export function buildControlDependencyGraphPackFromParts(input: {
  orgId: string | null;
  periodDays: number;
  auditEventsScanned: number;
  acceptedPolicyCount: number;
  nodes: ControlGraphNode[];
  edges: ControlGraphEdge[];
  generatedAt?: string;
}): ControlDependencyGraphPack {
  const hubControlIds = [...input.nodes]
    .filter((n) => n.degree > 0)
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 10)
    .map((n) => n.controlId);

  return {
    version: CONTROL_DEPENDENCY_GRAPH_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    periodDays: input.periodDays,
    orgId: input.orgId,
    auditEventsScanned: input.auditEventsScanned,
    acceptedPolicyCount: input.acceptedPolicyCount,
    nodes: input.nodes,
    edges: input.edges,
    hubControlIds,
    crossFrameworkEdgeCount: input.edges.filter((e) => e.crossFramework).length,
    sharedAuditEdgeCount: input.edges.filter((e) => e.kind === "shared_audit").length,
    sharedPolicyEdgeCount: input.edges.filter((e) => e.kind === "shared_policy").length,
    crosswalkEdgeCount: input.edges.filter((e) => e.kind === "crosswalk").length,
    thematicEdgeCount: input.edges.filter((e) => e.kind === "thematic").length,
    frameworkPairs: summarizeFrameworkPairs(input.edges),
  };
}

export async function buildControlDependencyGraphPack(
  userId: string,
  opts: {
    orgId: string | null;
    periodDays?: number;
    maxEdges?: number;
    supabase?: SupabaseClient;
  },
): Promise<ControlDependencyGraphPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const periodDays = opts.periodDays ?? 30;
  const maxEdges = opts.maxEdges ?? 120;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());
  const sinceIso = new Date(Date.now() - periodDays * 86_400_000).toISOString();

  const [summary, events, accepted] = await Promise.all([
    getComplianceCoverageSummary(userId, { sinceIso, orgId: opts.orgId, supabase }),
    listAuditEventTypesForCompliance(userId, { sinceIso, orgId: opts.orgId, supabase }),
    listAcceptedPolicyGuardrailsByPlaybook(supabase, userId),
  ]);

  const coverageByControl = new Map(
    summary.rows.map((r) => [
      r.control.id,
      {
        status: r.status,
        auditEvidenceCount: r.auditEvidenceCount,
        policyEvidenceCount: r.policyEvidenceCount,
      },
    ]),
  );

  const allEdges = mergeControlGraphEdges([
    ...buildCrosswalkEdges(),
    ...buildThematicEdges(),
    ...buildSharedAuditEdgesFromEventTypes(events),
    ...buildSharedPolicyEdges(accepted),
  ]);

  const edges = allEdges
    .sort((a, b) => b.weight - a.weight)
    .slice(0, maxEdges);

  const nodes = buildControlGraphNodes(coverageByControl, edges);

  return buildControlDependencyGraphPackFromParts({
    orgId: opts.orgId,
    periodDays,
    auditEventsScanned: summary.auditEventsScanned,
    acceptedPolicyCount: summary.acceptedPolicyCount,
    nodes,
    edges,
  });
}

export function controlDependencyGraphToCsv(pack: ControlDependencyGraphPack): string {
  const header = "source_id,target_id,kind,weight,cross_framework,label";
  const lines = pack.edges.map((e) =>
    [
      e.sourceId,
      e.targetId,
      e.kind,
      e.weight,
      e.crossFramework,
      JSON.stringify(e.label),
    ].join(","),
  );
  return `${header}\n${lines.join("\n")}\n`;
}
