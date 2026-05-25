import { applyUserOrOrgScope } from "@/lib/org/apply-scope-query";
import type { LegalHoldSummary } from "@/lib/legal-hold/types";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listLegalHoldsForUser(
  userId: string,
  orgId?: string | null,
): Promise<LegalHoldSummary> {
  const empty: LegalHoldSummary = { incidentCount: 0, auditHoldCount: 0, incidents: [] };
  if (!hasSupabaseAuth() || !userId) return empty;

  try {
    const supabase = await createServerSupabaseClient();

    let incidentQuery = supabase
      .from("incidents")
      .select(
        "id, title, severity, status, updated_at, legal_hold_reason, legal_hold_set_at, legal_hold_set_by",
      )
      .eq("legal_hold", true)
      .order("legal_hold_set_at", { ascending: false })
      .limit(50);
    incidentQuery = applyUserOrOrgScope(incidentQuery, userId, orgId);
    const { data: incidents } = await incidentQuery;

    let auditQuery = supabase
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("legal_hold", true);
    auditQuery = applyUserOrOrgScope(auditQuery, userId, orgId);
    const { count: auditHoldCount } = await auditQuery;

    const rows = (incidents ?? []).map((r) => ({
      id: String(r.id),
      title: String(r.title),
      severity: String(r.severity),
      status: String(r.status),
      updatedAt: String(r.updated_at),
      legalHoldReason: (r.legal_hold_reason as string | null) ?? null,
      legalHoldSetAt: (r.legal_hold_set_at as string | null) ?? null,
      legalHoldSetBy: (r.legal_hold_set_by as string | null) ?? null,
    }));

    return {
      incidentCount: rows.length,
      auditHoldCount: auditHoldCount ?? 0,
      incidents: rows,
    };
  } catch {
    return empty;
  }
}
