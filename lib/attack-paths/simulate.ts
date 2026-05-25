import type { ServiceDependencyEdge } from "@/lib/services/dependencies";
import type { ServiceRow } from "@/lib/services/data";

export type AttackPathStep = {
  serviceId: string;
  serviceName: string;
  detail: string;
};

export type AttackPathResult = {
  id: string;
  riskScore: number;
  riskBand: "critical" | "high" | "medium" | "low";
  entryServiceId: string;
  entryServiceName: string;
  targetServiceId: string;
  targetServiceName: string;
  steps: AttackPathStep[];
  findingCount: number;
  hopCount: number;
};

export type AttackPathSimulationInput = {
  services: ServiceRow[];
  edges: ServiceDependencyEdge[];
  /** serviceId -> open finding summaries at entry */
  entryFindingsByService: Map<
    string,
    { id: string; title: string; severity: string; cveId: string | null }[]
  >;
  targetServiceIds?: Set<string>;
  maxDepth?: number;
  maxPaths?: number;
};

const SEV_WEIGHT: Record<string, number> = {
  critical: 40,
  high: 28,
  medium: 16,
  low: 8,
};

const CRIT_WEIGHT: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const REL_WEIGHT: Record<string, number> = {
  auth: 1.5,
  data: 1.3,
  runtime: 1.2,
  network: 1.1,
  other: 1,
};

function isProductionService(service: ServiceRow): boolean {
  const env = (service.environment ?? "").trim().toLowerCase();
  return env === "production" || env === "prod";
}

function buildPivotAdjacency(edges: ServiceDependencyEdge[]): Map<string, { toId: string; edge: ServiceDependencyEdge }[]> {
  const adj = new Map<string, { toId: string; edge: ServiceDependencyEdge }[]>();
  for (const edge of edges) {
    // Compromise of dependency (toServiceId) can pivot into dependent (fromServiceId).
    const fromId = edge.toServiceId;
    const toId = edge.fromServiceId;
    const list = adj.get(fromId) ?? [];
    list.push({ toId, edge });
    adj.set(fromId, list);
  }
  return adj;
}

function entrySeverityWeight(findings: { severity: string }[]): number {
  let max = 0;
  for (const f of findings) {
    max = Math.max(max, SEV_WEIGHT[f.severity.toLowerCase()] ?? 12);
  }
  return max;
}

function scorePath(
  steps: AttackPathStep[],
  edgesUsed: ServiceDependencyEdge[],
  entryFindings: { severity: string }[],
  targetService: ServiceRow,
): { score: number; band: AttackPathResult["riskBand"] } {
  let score = entrySeverityWeight(entryFindings);
  for (const edge of edgesUsed) {
    score +=
      (CRIT_WEIGHT[edge.criticality] ?? 2) * (REL_WEIGHT[edge.relationship] ?? 1) * 4;
  }
  if (isProductionService(targetService)) score += 22;
  score -= Math.max(0, steps.length - 2) * 5;
  score = Math.min(100, Math.max(0, Math.round(score)));

  let band: AttackPathResult["riskBand"] = "low";
  if (score >= 80) band = "critical";
  else if (score >= 60) band = "high";
  else if (score >= 35) band = "medium";
  return { score, band };
}

function pathKey(ids: string[]): string {
  return ids.join(">");
}

export function simulateAttackPaths(input: AttackPathSimulationInput): AttackPathResult[] {
  const maxDepth = input.maxDepth ?? 6;
  const maxPaths = input.maxPaths ?? 25;
  const serviceById = new Map(input.services.map((s) => [s.id, s]));
  const adj = buildPivotAdjacency(input.edges);

  const entryServiceIds = [...input.entryFindingsByService.keys()].filter((id) => serviceById.has(id));
  const defaultTargets = new Set(
    input.services.filter(isProductionService).map((s) => s.id),
  );
  const targetIds =
    input.targetServiceIds && input.targetServiceIds.size > 0
      ? input.targetServiceIds
      : defaultTargets.size > 0
        ? defaultTargets
        : new Set(input.services.map((s) => s.id));

  const results: AttackPathResult[] = [];
  const seen = new Set<string>();

  for (const entryId of entryServiceIds) {
    const entryService = serviceById.get(entryId);
    if (!entryService) continue;
    const entryFindings = input.entryFindingsByService.get(entryId) ?? [];

    const queue: {
      nodeId: string;
      pathIds: string[];
      steps: AttackPathStep[];
      edgesUsed: ServiceDependencyEdge[];
    }[] = [
      {
        nodeId: entryId,
        pathIds: [entryId],
        steps: [
          {
            serviceId: entryId,
            serviceName: entryService.name,
            detail: `Entry — ${entryFindings.length} open finding(s): ${entryFindings
              .slice(0, 2)
              .map((f) => f.cveId ?? f.title.slice(0, 40))
              .join(", ")}`,
          },
        ],
        edgesUsed: [],
      },
    ];

    while (queue.length > 0 && results.length < maxPaths) {
      const current = queue.shift()!;
      if (current.pathIds.length > maxDepth) continue;

      if (
        current.nodeId !== entryId &&
        targetIds.has(current.nodeId) &&
        current.pathIds.length >= 2
      ) {
        const key = pathKey(current.pathIds);
        if (!seen.has(key)) {
          seen.add(key);
          const targetService = serviceById.get(current.nodeId)!;
          const { score, band } = scorePath(
            current.steps,
            current.edgesUsed,
            entryFindings,
            targetService,
          );
          results.push({
            id: key,
            riskScore: score,
            riskBand: band,
            entryServiceId: entryId,
            entryServiceName: entryService.name,
            targetServiceId: current.nodeId,
            targetServiceName: targetService.name,
            steps: current.steps,
            findingCount: entryFindings.length,
            hopCount: current.steps.length - 1,
          });
        }
      }

      const neighbors = adj.get(current.nodeId) ?? [];
      for (const { toId, edge } of neighbors) {
        if (current.pathIds.includes(toId)) continue;
        const nextService = serviceById.get(toId);
        if (!nextService) continue;
        queue.push({
          nodeId: toId,
          pathIds: [...current.pathIds, toId],
          steps: [
            ...current.steps,
            {
              serviceId: toId,
              serviceName: nextService.name,
              detail: `Pivot via ${edge.relationship} dependency (${edge.criticality} criticality) from ${serviceById.get(edge.toServiceId)?.name ?? "dependency"}`,
            },
          ],
          edgesUsed: [...current.edgesUsed, edge],
        });
      }
    }
  }

  return results.sort((a, b) => b.riskScore - a.riskScore).slice(0, maxPaths);
}
