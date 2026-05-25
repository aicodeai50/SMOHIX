import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { applyUserOrOrgScope } from "@/lib/org/apply-scope-query";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

const REASON_MAX = 500;

export async function setIncidentLegalHold(
  userId: string,
  incidentId: string,
  opts: { orgId?: string | null; reason: string },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!hasSupabaseAuth() || !userId) {
    return { ok: false, reason: "Not configured." };
  }

  const reason = opts.reason.trim().slice(0, REASON_MAX);
  if (!reason) {
    return { ok: false, reason: "Legal hold reason is required." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("incidents").update({
      legal_hold: true,
      legal_hold_reason: reason,
      legal_hold_set_at: new Date().toISOString(),
      legal_hold_set_by: userId,
      updated_at: new Date().toISOString(),
    });
    query = applyUserOrOrgScope(query, userId, opts.orgId).eq("id", incidentId);
    const { data, error } = await query.select("id").maybeSingle();
    if (error || !data) {
      return { ok: false, reason: error?.message ?? "Incident not found." };
    }

    const admin = createServiceSupabaseClient();
    if (admin) {
      let auditUpdate = admin
        .from("audit_log")
        .update({ legal_hold: true })
        .filter("details->>incident_id", "eq", incidentId);
      if (opts.orgId) {
        auditUpdate = auditUpdate.eq("org_id", opts.orgId);
      } else {
        auditUpdate = auditUpdate.eq("user_id", userId);
      }
      await auditUpdate;
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "Could not set legal hold." };
  }
}

export async function clearIncidentLegalHold(
  userId: string,
  incidentId: string,
  opts: { orgId?: string | null },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!hasSupabaseAuth() || !userId) {
    return { ok: false, reason: "Not configured." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("incidents").update({
      legal_hold: false,
      legal_hold_reason: null,
      legal_hold_set_at: null,
      legal_hold_set_by: null,
      updated_at: new Date().toISOString(),
    });
    query = applyUserOrOrgScope(query, userId, opts.orgId).eq("id", incidentId);
    const { data, error } = await query.select("id").maybeSingle();
    if (error || !data) {
      return { ok: false, reason: error?.message ?? "Incident not found." };
    }

    const admin = createServiceSupabaseClient();
    if (admin) {
      let auditUpdate = admin
        .from("audit_log")
        .update({ legal_hold: false })
        .filter("details->>incident_id", "eq", incidentId);
      if (opts.orgId) {
        auditUpdate = auditUpdate.eq("org_id", opts.orgId);
      } else {
        auditUpdate = auditUpdate.eq("user_id", userId);
      }
      await auditUpdate;
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "Could not clear legal hold." };
  }
}
