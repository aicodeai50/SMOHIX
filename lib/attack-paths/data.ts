import type { SupabaseClient } from "@supabase/supabase-js";

import { simulateAttackPaths, type AttackPathResult } from "@/lib/attack-paths/simulate";
import { listServicesForUser } from "@/lib/services/data";
import { listServiceDependencyGraphForUser } from "@/lib/services/dependencies";
import { listVulnerabilityFindingsForUser } from "@/lib/vulnerabilities/data";
import { matchAssetHostToService } from "@/lib/vulnerabilities/priority";

export type AttackPathSimulationSummary = {
  paths: AttackPathResult[];
  stats: {
    entryServices: number;
    productionTargets: number;
    dependencyEdges: number;
    openFindings: number;
  };
};

const ENTRY_SEVERITIES = new Set(["critical", "high"]);

export async function runAttackPathSimulationForUser(
  supabase: SupabaseClient,
  userId: string,
  orgId: string | null = null,
  options?: { targetServiceId?: string; maxDepth?: number },
): Promise<AttackPathSimulationSummary> {
  const [services, graph, findings] = await Promise.all([
    listServicesForUser(userId, orgId),
    listServiceDependencyGraphForUser(supabase, userId, orgId),
    listVulnerabilityFindingsForUser(userId, 200),
  ]);

  const openFindings = findings.filter(
    (f) =>
      (f.status === "open" || f.status === "in_progress") &&
      ENTRY_SEVERITIES.has(f.severity.toLowerCase()),
  );

  const entryFindingsByService = new Map<
    string,
    { id: string; title: string; severity: string; cveId: string | null }[]
  >();

  for (const finding of openFindings) {
    const matched = matchAssetHostToService(finding.assetHost, services);
    if (!matched) continue;
    const list = entryFindingsByService.get(matched.id) ?? [];
    list.push({
      id: finding.id,
      title: finding.title,
      severity: finding.severity,
      cveId: finding.cveId,
    });
    entryFindingsByService.set(matched.id, list);
  }

  const productionTargets = services.filter((s) => {
    const env = (s.environment ?? "").trim().toLowerCase();
    return env === "production" || env === "prod";
  });

  const targetServiceIds = options?.targetServiceId
    ? new Set([options.targetServiceId])
    : undefined;

  const paths = simulateAttackPaths({
    services,
    edges: graph.edges,
    entryFindingsByService,
    targetServiceIds,
    maxDepth: options?.maxDepth,
  });

  return {
    paths,
    stats: {
      entryServices: entryFindingsByService.size,
      productionTargets: productionTargets.length,
      dependencyEdges: graph.edges.length,
      openFindings: openFindings.length,
    },
  };
}
