import { listServicesForUser } from "@/lib/services/data";

import {
  computeExposureScore,
  type ExposurePriorityBand,
  type AssetCriticality,
} from "@/lib/vulnerabilities/priority";

import type { VulnerabilityFindingRow } from "@/lib/vulnerabilities/data";

export type PrioritizedVulnerabilityFinding = VulnerabilityFindingRow & {
  exposureScore: number;
  exposurePriority: ExposurePriorityBand;
  assetCriticality: AssetCriticality;
  matchedServiceName: string | null;
};

export async function prioritizeVulnerabilityFindings(
  userId: string,
  rows: VulnerabilityFindingRow[],
  orgId: string | null = null,
): Promise<PrioritizedVulnerabilityFinding[]> {
  const services = await listServicesForUser(userId, orgId);

  const enriched = rows.map((row) => {
    const scored = computeExposureScore(
      {
        severity: row.severity,
        cvssScore: row.cvssScore,
        assetHost: row.assetHost,
        status: row.status,
        detectedAt: row.detectedAt,
      },
      services,
    );

    return {
      ...row,
      exposureScore: scored.exposureScore,
      exposurePriority: scored.exposurePriority,
      assetCriticality: scored.assetCriticality,
      matchedServiceName: scored.matchedServiceName,
    };
  });

  return enriched.sort((a, b) => {
    if (b.exposureScore !== a.exposureScore) return b.exposureScore - a.exposureScore;
    return new Date(b.detectedAt).valueOf() - new Date(a.detectedAt).valueOf();
  });
}
