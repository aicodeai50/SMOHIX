import type { DeploymentTier } from "@/lib/deployment/types";

export const RETENTION_MIN_DAYS = 7;

export type TierRetentionLimits = {
  defaultAuditDays: number;
  defaultIncidentDays: number;
  maxAuditDays: number;
  maxIncidentDays: number;
};

export const TIER_RETENTION_LIMITS: Record<DeploymentTier, TierRetentionLimits> = {
  standard: {
    defaultAuditDays: 90,
    defaultIncidentDays: 90,
    maxAuditDays: 180,
    maxIncidentDays: 365,
  },
  regulated: {
    defaultAuditDays: 180,
    defaultIncidentDays: 365,
    maxAuditDays: 365,
    maxIncidentDays: 730,
  },
  fedramp_ready: {
    defaultAuditDays: 365,
    defaultIncidentDays: 730,
    maxAuditDays: 2555,
    maxIncidentDays: 2555,
  },
};

export type OrgRetentionPolicy = {
  deploymentTier: DeploymentTier;
  auditRetentionDays: number;
  incidentRetentionDays: number;
  auditOverrideDays: number | null;
  incidentOverrideDays: number | null;
  tierDefaultAuditDays: number;
  tierDefaultIncidentDays: number;
  maxAuditDays: number;
  maxIncidentDays: number;
  minDays: number;
};

export function effectiveRetentionDays(
  tier: DeploymentTier,
  resource: "audit" | "incident",
  overrideDays: number | null | undefined,
): number {
  const limits = TIER_RETENTION_LIMITS[tier];
  const fallback = resource === "audit" ? limits.defaultAuditDays : limits.defaultIncidentDays;
  if (overrideDays == null) return fallback;
  return overrideDays;
}

export function buildOrgRetentionPolicy(input: {
  deploymentTier: DeploymentTier;
  auditOverrideDays?: number | null;
  incidentOverrideDays?: number | null;
}): OrgRetentionPolicy {
  const limits = TIER_RETENTION_LIMITS[input.deploymentTier];
  const auditOverrideDays = input.auditOverrideDays ?? null;
  const incidentOverrideDays = input.incidentOverrideDays ?? null;

  return {
    deploymentTier: input.deploymentTier,
    auditRetentionDays: effectiveRetentionDays(input.deploymentTier, "audit", auditOverrideDays),
    incidentRetentionDays: effectiveRetentionDays(
      input.deploymentTier,
      "incident",
      incidentOverrideDays,
    ),
    auditOverrideDays,
    incidentOverrideDays,
    tierDefaultAuditDays: limits.defaultAuditDays,
    tierDefaultIncidentDays: limits.defaultIncidentDays,
    maxAuditDays: limits.maxAuditDays,
    maxIncidentDays: limits.maxIncidentDays,
    minDays: RETENTION_MIN_DAYS,
  };
}

export type RetentionUpdateInput = {
  auditRetentionDays: number | null;
  incidentRetentionDays: number | null;
};

export function validateRetentionUpdate(
  tier: DeploymentTier,
  input: RetentionUpdateInput,
): { ok: true; normalized: RetentionUpdateInput } | { ok: false; reason: string } {
  const limits = TIER_RETENTION_LIMITS[tier];

  const check = (
    value: number | null,
    resource: "audit" | "incident",
  ): { ok: true; value: number | null } | { ok: false; reason: string } => {
    if (value == null) return { ok: true, value: null };
    if (!Number.isFinite(value) || value < RETENTION_MIN_DAYS) {
      return { ok: false, reason: `${resource} retention must be at least ${RETENTION_MIN_DAYS} days.` };
    }
    const max = resource === "audit" ? limits.maxAuditDays : limits.maxIncidentDays;
    if (value > max) {
      return {
        ok: false,
        reason: `${resource} retention cannot exceed ${max} days for the ${tier} tier.`,
      };
    }
    return { ok: true, value: Math.floor(value) };
  };

  const audit = check(input.auditRetentionDays, "audit");
  if (!audit.ok) return audit;
  const incident = check(input.incidentRetentionDays, "incident");
  if (!incident.ok) return incident;

  return {
    ok: true,
    normalized: {
      auditRetentionDays: audit.value,
      incidentRetentionDays: incident.value,
    },
  };
}

export function parseRetentionDaysField(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === "default") return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}
