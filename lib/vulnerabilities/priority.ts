import type { ServiceRow } from "@/lib/services/data";

export type ExposurePriorityBand = "critical" | "high" | "medium" | "low";

export type AssetCriticality = "critical" | "high" | "medium" | "low" | "unknown";

export type ExposureScoreInput = {
  severity: string;
  cvssScore: number | null;
  assetHost: string | null;
  status: string;
  detectedAt: string;
};

export type ExposureScoreResult = {
  exposureScore: number;
  exposurePriority: ExposurePriorityBand;
  assetCriticality: AssetCriticality;
  matchedServiceName: string | null;
};

const SEV_BASE: Record<string, number> = {
  critical: 90,
  high: 70,
  medium: 45,
  low: 20,
};

const ENV_CRITICALITY: Record<string, AssetCriticality> = {
  production: "critical",
  prod: "critical",
  staging: "medium",
  stage: "medium",
  uat: "medium",
  development: "low",
  dev: "low",
  test: "low",
  sandbox: "low",
};

const CRIT_WEIGHT: Record<AssetCriticality, number> = {
  critical: 30,
  high: 22,
  medium: 12,
  low: 5,
  unknown: 8,
};

function severityBase(severity: string, cvssScore: number | null): number {
  if (cvssScore != null && Number.isFinite(cvssScore)) {
    return Math.min(100, Math.max(0, cvssScore * 10));
  }
  return SEV_BASE[severity.toLowerCase()] ?? 40;
}

function environmentCriticality(environment: string | null): AssetCriticality {
  if (!environment?.trim()) return "unknown";
  const key = environment.trim().toLowerCase();
  return ENV_CRITICALITY[key] ?? "medium";
}

export function hostMatchesService(assetHost: string, service: ServiceRow): boolean {
  const asset = assetHost.trim().toLowerCase();
  const name = service.name.trim().toLowerCase();
  if (!asset || !name) return false;
  if (asset === name) return true;
  if (asset.includes(name) || name.includes(asset)) return true;
  if (asset.startsWith(`${name}.`) || asset.endsWith(`.${name}`)) return true;
  return false;
}

export function matchAssetHostToService(
  assetHost: string | null,
  services: ServiceRow[],
): ServiceRow | null {
  if (!assetHost?.trim()) return null;
  for (const service of services) {
    if (hostMatchesService(assetHost, service)) return service;
  }
  return null;
}

export function resolveAssetCriticality(
  assetHost: string | null,
  services: ServiceRow[],
): { criticality: AssetCriticality; matchedServiceName: string | null } {
  if (!assetHost?.trim()) {
    return { criticality: "unknown", matchedServiceName: null };
  }

  for (const service of services) {
    if (hostMatchesService(assetHost, service)) {
      return {
        criticality: environmentCriticality(service.environment),
        matchedServiceName: service.name,
      };
    }
  }

  const asset = assetHost.toLowerCase();
  if (asset.includes("prod") || asset.includes("production")) {
    return { criticality: "critical", matchedServiceName: null };
  }
  if (asset.includes("staging") || asset.includes("stage")) {
    return { criticality: "medium", matchedServiceName: null };
  }
  if (asset.includes("dev") || asset.includes("test") || asset.includes("sandbox")) {
    return { criticality: "low", matchedServiceName: null };
  }

  return { criticality: "unknown", matchedServiceName: null };
}

function recencyBoost(detectedAt: string, status: string): number {
  if (status !== "open" && status !== "in_progress") return 0;
  const ageMs = Date.now() - new Date(detectedAt).valueOf();
  if (Number.isNaN(ageMs) || ageMs < 0) return 5;
  const days = ageMs / (1000 * 60 * 60 * 24);
  if (days <= 2) return 10;
  if (days <= 7) return 6;
  if (days <= 30) return 3;
  return 0;
}

function scoreToBand(score: number): ExposurePriorityBand {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function computeExposureScore(
  input: ExposureScoreInput,
  services: ServiceRow[],
): ExposureScoreResult {
  const { criticality, matchedServiceName } = resolveAssetCriticality(
    input.assetHost,
    services,
  );

  const base = severityBase(input.severity, input.cvssScore);
  const assetWeight = CRIT_WEIGHT[criticality];
  const recency = recencyBoost(input.detectedAt, input.status);

  const raw = base * 0.55 + assetWeight * 1.8 + recency;
  const exposureScore = Math.min(100, Math.round(raw));

  return {
    exposureScore,
    exposurePriority: scoreToBand(exposureScore),
    assetCriticality: criticality,
    matchedServiceName,
  };
}

export function compareExposurePriority(a: ExposureScoreResult, b: ExposureScoreResult): number {
  if (b.exposureScore !== a.exposureScore) return b.exposureScore - a.exposureScore;
  return 0;
}
