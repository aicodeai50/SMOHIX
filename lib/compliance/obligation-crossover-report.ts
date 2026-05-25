import type { SupabaseClient } from "@supabase/supabase-js";

import { listControlAttestationBoard } from "@/lib/compliance/attestation/data";
import type { ControlAttestationRow } from "@/lib/compliance/attestation/types";
import { listAssessorEvidenceRequests } from "@/lib/compliance/assessor-evidence-requests";
import { getComplianceControl } from "@/lib/compliance/catalog";
import {
  THEMATIC_CONTROL_DEPENDENCY_LINKS,
} from "@/lib/compliance/control-dependency-graph";
import {
  buildControlTestingSchedulesPack,
} from "@/lib/compliance/control-testing-schedules";
import { buildGrcComplianceCalendar } from "@/lib/compliance/grc-calendar";
import {
  classifyObligationUrgency,
  collectRegulatoryObligationItems,
  type ObligationDimension,
  type ObligationUrgency,
  type RegulatoryObligationItem,
} from "@/lib/compliance/regulatory-obligation-heatmap";
import { SOC2_ISO_CROSSWALK_LINKS } from "@/lib/compliance/soc2-iso-crosswalk";
import type { ComplianceFramework } from "@/lib/compliance/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const OBLIGATION_CROSSOVER_REPORT_VERSION = "zentro-obligation-crossover-report/1";

export const CROSSOVER_DUE_WINDOW_DAYS = 7;

export type CrossoverObligationEntry = {
  id: string;
  title: string;
  dueAt: string;
  dueWindowKey: string;
  urgency: ObligationUrgency;
  dimension: ObligationDimension;
  href: string;
  primaryFramework: ComplianceFramework | null;
  controlIds: string[];
  linkedFrameworks: ComplianceFramework[];
};

export type FrameworkPairCrossover = {
  frameworkA: ComplianceFramework;
  frameworkB: ComplianceFramework;
  sharedObligationCount: number;
  linkedControlCount: number;
};

export type ObligationCrossoverCluster = {
  id: string;
  kind: "shared_control" | "shared_due_window";
  theme: string;
  windowStart: string;
  windowEnd: string;
  controlIds: string[];
  controlRefs: string[];
  frameworks: ComplianceFramework[];
  obligationIds: string[];
  obligationCount: number;
  overdueCount: number;
  evidenceReuseNote: string;
};

export type ObligationReuseOpportunity = {
  clusterId: string;
  title: string;
  frameworks: ComplianceFramework[];
  frameworkLabels: string[];
  controlRefs: string[];
  windowStart: string;
  windowEnd: string;
  obligationCount: number;
  overdueCount: number;
  evidenceReuseNote: string;
};

export type ObligationCrossoverReportPack = {
  version: typeof OBLIGATION_CROSSOVER_REPORT_VERSION;
  generatedAt: string;
  orgId: string | null;
  horizonDays: number;
  dueWindowDays: number;
  totalObligations: number;
  multiFrameworkObligationCount: number;
  crossoverClusterCount: number;
  sharedDueWindowCount: number;
  frameworkPairs: FrameworkPairCrossover[];
  entries: CrossoverObligationEntry[];
  clusters: ObligationCrossoverCluster[];
  topReuseOpportunities: ObligationReuseOpportunity[];
};

export function dueWindowKey(iso: string, anchor = new Date(iso)): string {
  const d = new Date(anchor);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - day);
  return start.toISOString().slice(0, 10);
}

export function dueWindowsOverlap(aIso: string, bIso: string, windowDays = CROSSOVER_DUE_WINDOW_DAYS): boolean {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.abs(a - b) <= windowDays * 86_400_000;
}

export function buildCrossFrameworkControlAdjacency(): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };
  for (const row of SOC2_ISO_CROSSWALK_LINKS) {
    link(row.soc2Id, row.isoId);
  }
  for (const row of THEMATIC_CONTROL_DEPENDENCY_LINKS) {
    link(row.controlA, row.controlB);
  }
  return adj;
}

export function linkedControlIds(
  seedControlIds: string[],
  adjacency: Map<string, Set<string>>,
): Set<string> {
  const seen = new Set<string>();
  const queue = [...seedControlIds];
  while (queue.length > 0) {
    const id = queue.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const neighbor of adjacency.get(id) ?? []) {
      if (!seen.has(neighbor)) queue.push(neighbor);
    }
  }
  return seen;
}

export function controlsLinked(a: string[], b: string[], adjacency: Map<string, Set<string>>): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const linkedA = linkedControlIds(a, adjacency);
  return b.some((id) => linkedA.has(id));
}

function frameworksForControlIds(controlIds: string[]): ComplianceFramework[] {
  const set = new Set<ComplianceFramework>();
  for (const id of controlIds) {
    const ctrl = getComplianceControl(id);
    if (ctrl) set.add(ctrl.framework);
  }
  return [...set].sort();
}

function attestationControlIdByEventId(
  attestations: ControlAttestationRow[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of attestations) {
    if (row.status === "attested") continue;
    map.set(`attestation-${row.id}`, row.controlId);
  }
  return map;
}

export function buildCrossoverObligationEntries(input: {
  items: RegulatoryObligationItem[];
  attestations: ControlAttestationRow[];
  testingControlIdsByObligationId: Map<string, string[]>;
  evidenceControlIdByObligationId: Map<string, string>;
  adjacency?: Map<string, Set<string>>;
  now?: Date;
}): CrossoverObligationEntry[] {
  const adjacency = input.adjacency ?? buildCrossFrameworkControlAdjacency();
  const attestationMap = attestationControlIdByEventId(input.attestations);

  return input.items.map((item) => {
    const controlIds: string[] = [];
    if (item.dimension === "assessor") {
      const cid = input.evidenceControlIdByObligationId.get(item.id);
      if (cid) controlIds.push(cid);
    } else if (item.dimension === "testing") {
      controlIds.push(...(input.testingControlIdsByObligationId.get(item.id) ?? []));
    } else if (item.dimension === "attestation") {
      const cid = attestationMap.get(item.id);
      if (cid) controlIds.push(cid);
    }

    const linked = linkedControlIds(controlIds, adjacency);
    const linkedFrameworks = frameworksForControlIds([...linked]);
    const primaryFramework =
      item.framework ?? (linkedFrameworks.length === 1 ? linkedFrameworks[0] : null);

    return {
      id: item.id,
      title: item.title,
      dueAt: item.dueAt,
      dueWindowKey: dueWindowKey(item.dueAt),
      urgency: item.urgency,
      dimension: item.dimension,
      href: item.href,
      primaryFramework,
      controlIds: [...new Set(controlIds)],
      linkedFrameworks,
    };
  });
}

class UnionFind {
  private parent = new Map<string, string>();

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let p = this.parent.get(x)!;
    if (p !== x) {
      p = this.find(p);
      this.parent.set(x, p);
    }
    return p;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

function pairKey(a: ComplianceFramework, b: ComplianceFramework): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function buildObligationCrossoverReportFromEntries(input: {
  orgId: string | null;
  horizonDays: number;
  entries: CrossoverObligationEntry[];
  adjacency?: Map<string, Set<string>>;
  generatedAt?: string;
}): ObligationCrossoverReportPack {
  const adjacency = input.adjacency ?? buildCrossFrameworkControlAdjacency();
  const entries = input.entries;

  const multiFrameworkObligationCount = entries.filter(
    (e) => e.linkedFrameworks.length >= 2,
  ).length;

  const uf = new UnionFind();
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const a = entries[i]!;
      const b = entries[j]!;
      if (a.linkedFrameworks.length < 1 && b.linkedFrameworks.length < 1) continue;

      const frameworks = new Set([...a.linkedFrameworks, ...b.linkedFrameworks]);
      if (frameworks.size < 2) continue;

      const sameWindow =
        a.dueWindowKey === b.dueWindowKey || dueWindowsOverlap(a.dueAt, b.dueAt);
      const controlLinked = controlsLinked(a.controlIds, b.controlIds, adjacency);

      if (controlLinked || (sameWindow && a.controlIds.length > 0 && b.controlIds.length > 0)) {
        uf.union(a.id, b.id);
      } else if (sameWindow && a.primaryFramework && b.primaryFramework && a.primaryFramework !== b.primaryFramework) {
        uf.union(a.id, b.id);
      }
    }
  }

  const groups = new Map<string, CrossoverObligationEntry[]>();
  for (const entry of entries) {
    const root = uf.find(entry.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(entry);
  }

  const clusters: ObligationCrossoverCluster[] = [];
  let clusterIndex = 0;

  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const frameworks = [
      ...new Set(group.flatMap((g) => g.linkedFrameworks.length ? g.linkedFrameworks : g.primaryFramework ? [g.primaryFramework] : [])),
    ].sort() as ComplianceFramework[];

    if (frameworks.length < 2) continue;

    const controlIds = [...new Set(group.flatMap((g) => g.controlIds))];
    const linkedControls = linkedControlIds(controlIds, adjacency);
    const controlRefs = [...linkedControls]
      .map((id) => getComplianceControl(id)?.ref ?? id)
      .slice(0, 8);

    const dueDates = group.map((g) => g.dueAt).sort();
    const windowStart = dueDates[0]!;
    const windowEnd = dueDates[dueDates.length - 1]!;
    const overdueCount = group.filter((g) => g.urgency === "overdue").length;

    const sameWeek = group.every((g) => g.dueWindowKey === group[0]!.dueWindowKey);
    const kind: ObligationCrossoverCluster["kind"] =
      controlIds.length > 0 && controlsLinked(controlIds, controlIds, adjacency)
        ? "shared_control"
        : "shared_due_window";

    const theme =
      kind === "shared_control"
        ? controlIds.length > 0
          ? "cross_framework_control_link"
          : "shared_due_window"
        : "aligned_due_window";

    const evidenceReuseNote =
      kind === "shared_control"
        ? `Collect evidence once for ${controlRefs.slice(0, 3).join(", ")}${controlRefs.length > 3 ? "…" : ""} — satisfies ${frameworks.length} framework packs via catalog crosswalk and thematic links.`
        : `Align collection for ${group.length} obligations due ${sameWeek ? "same week" : `within ${CROSSOVER_DUE_WINDOW_DAYS} days`} across ${frameworks.join(", ")}.`;

    clusterIndex += 1;
    clusters.push({
      id: `cluster-${clusterIndex}`,
      kind,
      theme,
      windowStart,
      windowEnd,
      controlIds: [...linkedControls],
      controlRefs,
      frameworks,
      obligationIds: group.map((g) => g.id),
      obligationCount: group.length,
      overdueCount,
      evidenceReuseNote,
    });
  }

  clusters.sort(
    (a, b) =>
      b.overdueCount - a.overdueCount ||
      b.frameworks.length - a.frameworks.length ||
      b.obligationCount - a.obligationCount,
  );

  const pairCounts = new Map<string, FrameworkPairCrossover>();
  for (const cluster of clusters) {
    for (let i = 0; i < cluster.frameworks.length; i += 1) {
      for (let j = i + 1; j < cluster.frameworks.length; j += 1) {
        const a = cluster.frameworks[i]!;
        const b = cluster.frameworks[j]!;
        const key = pairKey(a, b);
        const existing = pairCounts.get(key) ?? {
          frameworkA: a < b ? a : b,
          frameworkB: a < b ? b : a,
          sharedObligationCount: 0,
          linkedControlCount: 0,
        };
        existing.sharedObligationCount += cluster.obligationCount;
        existing.linkedControlCount += cluster.controlIds.length;
        pairCounts.set(key, existing);
      }
    }
  }

  const topReuseOpportunities: ObligationReuseOpportunity[] = clusters.slice(0, 12).map((c) => ({
    clusterId: c.id,
    title: `${c.frameworks.length} frameworks · ${c.obligationCount} obligations`,
    frameworks: c.frameworks,
    frameworkLabels: c.frameworks,
    controlRefs: c.controlRefs,
    windowStart: c.windowStart,
    windowEnd: c.windowEnd,
    obligationCount: c.obligationCount,
    overdueCount: c.overdueCount,
    evidenceReuseNote: c.evidenceReuseNote,
  }));

  const sharedDueWindowCount = clusters.filter((c) => c.kind === "shared_due_window").length;

  return {
    version: OBLIGATION_CROSSOVER_REPORT_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    orgId: input.orgId,
    horizonDays: input.horizonDays,
    dueWindowDays: CROSSOVER_DUE_WINDOW_DAYS,
    totalObligations: entries.length,
    multiFrameworkObligationCount,
    crossoverClusterCount: clusters.length,
    sharedDueWindowCount,
    frameworkPairs: [...pairCounts.values()].sort(
      (a, b) => b.sharedObligationCount - a.sharedObligationCount,
    ),
    entries,
    clusters,
    topReuseOpportunities,
  };
}

export async function buildObligationCrossoverReportPack(
  userId: string,
  opts: {
    orgId: string | null;
    horizonDays?: number;
    supabase?: SupabaseClient;
  },
): Promise<ObligationCrossoverReportPack | null> {
  if (!hasSupabaseAuth() || !userId || !opts.orgId) return null;

  const horizonDays = opts.horizonDays ?? 90;
  const supabase = opts.supabase ?? (await createServerSupabaseClient());

  const [calendar, testing, evidenceRequests, attestations] = await Promise.all([
    buildGrcComplianceCalendar(userId, { orgId: opts.orgId, horizonDays, supabase }),
    buildControlTestingSchedulesPack(userId, { orgId: opts.orgId, horizonDays, supabase }),
    listAssessorEvidenceRequests(opts.orgId, supabase),
    listControlAttestationBoard(userId, opts.orgId, supabase),
  ]);

  const items = collectRegulatoryObligationItems({
    calendar,
    testing,
    evidenceRequests,
    horizonDays,
  });

  const testingControlIdsByObligationId = new Map<string, string[]>();
  if (testing) {
    for (const schedule of testing.schedules) {
      if (schedule.status === "completed") continue;
      const obligationId = `testing-${schedule.id}`;
      testingControlIdsByObligationId.set(obligationId, schedule.controlIds);
    }
  }

  const evidenceControlIdByObligationId = new Map<string, string>();
  for (const req of evidenceRequests) {
    if (req.status === "fulfilled" || req.status === "cancelled") continue;
    evidenceControlIdByObligationId.set(`evidence-req-${req.id}`, req.controlId);
  }

  const entries = buildCrossoverObligationEntries({
    items,
    attestations,
    testingControlIdsByObligationId,
    evidenceControlIdByObligationId,
  });

  return buildObligationCrossoverReportFromEntries({
    orgId: opts.orgId,
    horizonDays,
    entries,
  });
}

export function obligationCrossoverReportToCsv(pack: ObligationCrossoverReportPack): string {
  const lines = [
    "cluster_id,kind,frameworks,obligation_count,overdue_count,window_start,window_end,control_refs,evidence_note",
    ...pack.clusters.map((c) =>
      [
        c.id,
        c.kind,
        JSON.stringify(c.frameworks.join("+")),
        c.obligationCount,
        c.overdueCount,
        c.windowStart.slice(0, 10),
        c.windowEnd.slice(0, 10),
        JSON.stringify(c.controlRefs.join(";")),
        JSON.stringify(c.evidenceReuseNote),
      ].join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}
