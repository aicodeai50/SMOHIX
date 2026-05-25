import {
  buildOrgRetentionPolicy,
  type OrgRetentionPolicy,
  validateRetentionUpdate,
  type RetentionUpdateInput,
} from "@/lib/retention/policy";
import type { DeploymentTier } from "@/lib/deployment/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getRetentionPolicyForOrg(
  orgId: string,
  deploymentTier: DeploymentTier,
  overrides?: {
    auditRetentionDays?: number | null;
    incidentRetentionDays?: number | null;
  },
): Promise<OrgRetentionPolicy | null> {
  try {
    if (overrides) {
      return buildOrgRetentionPolicy({
        deploymentTier,
        auditOverrideDays: overrides.auditRetentionDays,
        incidentOverrideDays: overrides.incidentRetentionDays,
      });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("deployment_tier, audit_retention_days, incident_retention_days")
      .eq("id", orgId)
      .maybeSingle();

    if (error || !data) return null;

    const tierRaw = String(data.deployment_tier ?? deploymentTier);
    const tier: DeploymentTier =
      tierRaw === "regulated" || tierRaw === "fedramp_ready" ? tierRaw : "standard";
    return buildOrgRetentionPolicy({
      deploymentTier: tier,
      auditOverrideDays: (data.audit_retention_days as number | null) ?? null,
      incidentOverrideDays: (data.incident_retention_days as number | null) ?? null,
    });
  } catch {
    return null;
  }
}

export async function updateRetentionPolicyForOrg(
  orgId: string,
  deploymentTier: DeploymentTier,
  input: RetentionUpdateInput,
): Promise<{ ok: true; policy: OrgRetentionPolicy } | { ok: false; reason: string }> {
  const validated = validateRetentionUpdate(deploymentTier, input);
  if (!validated.ok) return validated;

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("organizations")
      .update({
        audit_retention_days: validated.normalized.auditRetentionDays,
        incident_retention_days: validated.normalized.incidentRetentionDays,
      })
      .eq("id", orgId);

    if (error) return { ok: false, reason: error.message };

    return {
      ok: true,
      policy: buildOrgRetentionPolicy({
        deploymentTier,
        auditOverrideDays: validated.normalized.auditRetentionDays,
        incidentOverrideDays: validated.normalized.incidentRetentionDays,
      }),
    };
  } catch {
    return { ok: false, reason: "Could not update retention policy." };
  }
}
