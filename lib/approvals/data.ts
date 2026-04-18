import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/env";

import { DEMO_PENDING } from "./demo";
import { devListApprovals } from "./dev-store";
import type { ApprovalRow, ApprovalsListResult } from "./types";

function mapRow(r: {
  id: string;
  action_label: string;
  requested_by: string | null;
  policy_hint: string | null;
  status: string;
}): ApprovalRow {
  return {
    id: r.id,
    action: r.action_label,
    requestedBy: r.requested_by ?? "—",
    policy: r.policy_hint ?? "—",
    status: r.status as ApprovalRow["status"],
  };
}

export type ListApprovalsParams = {
  userId: string;
  /** When Supabase auth is off, scope demo approvals to this browser session. */
  devTenantId?: string | null;
};

export async function listApprovalsForUser(
  params: ListApprovalsParams | string,
): Promise<ApprovalsListResult> {
  const userId = typeof params === "string" ? params : params.userId;
  const devTenantId =
    typeof params === "string" ? null : (params.devTenantId ?? null);

  if (!hasSupabaseAuth()) {
    if (devTenantId) {
      const { pending, recent } = devListApprovals(devTenantId);
      return { source: "demo", pending, recent };
    }
    return { source: "demo", pending: DEMO_PENDING, recent: [] };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: pendData, error: pendErr } = await supabase
      .from("approval_requests")
      .select("id, action_label, requested_by, policy_hint, status")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("updated_at", { ascending: false });

    const { data: recentData, error: recentErr } = await supabase
      .from("approval_requests")
      .select("id, action_label, requested_by, policy_hint, status")
      .eq("user_id", userId)
      .in("status", ["approved", "denied"])
      .order("updated_at", { ascending: false })
      .limit(20);

    if (pendErr || recentErr) {
      const err = pendErr ?? recentErr;
      const missing =
        err?.code === "42P01" ||
        err?.message.toLowerCase().includes("relation") ||
        err?.message.toLowerCase().includes("does not exist");
      if (missing) {
        return { source: "demo", pending: DEMO_PENDING, recent: [] };
      }
      return { source: "demo", pending: DEMO_PENDING, recent: [] };
    }

    const pending = (pendData ?? []).map((r) =>
      mapRow({
        id: r.id as string,
        action_label: r.action_label as string,
        requested_by: r.requested_by as string | null,
        policy_hint: r.policy_hint as string | null,
        status: r.status as string,
      }),
    );

    const recent = (recentData ?? []).map((r) =>
      mapRow({
        id: r.id as string,
        action_label: r.action_label as string,
        requested_by: r.requested_by as string | null,
        policy_hint: r.policy_hint as string | null,
        status: r.status as string,
      }),
    );

    return { source: "database", pending, recent };
  } catch {
    return { source: "demo", pending: DEMO_PENDING, recent: [] };
  }
}
