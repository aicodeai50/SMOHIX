import type { SupabaseClient } from "@supabase/supabase-js";
import { applyUserOrOrgScope } from "@/lib/org/apply-scope-query";

export function approvalMatchesExecution(row: { status?: unknown; action_label?: unknown; decided_by?: unknown; requester_id?: unknown; user_id?: unknown; updated_at?: unknown } | null,
  playbook: { id: string; name: string }, now = Date.now()): boolean {
  if (!row || row.status !== "approved" || typeof row.decided_by !== "string" || !row.decided_by) return false;
  if (row.decided_by === (row.requester_id ?? row.user_id)) return false;
  if (row.action_label !== playbook.name && row.action_label !== playbook.id) return false;
  const age = now - Date.parse(String(row.updated_at));
  return Number.isFinite(age) && age >= 0 && age <= 2 * 60 * 60 * 1000;
}

export async function verifyExecutionApproval(supabase: SupabaseClient, userId: string, orgId: string | null,
  approvalId: string | null, playbook: { id: string; name: string }): Promise<boolean> {
  if (!approvalId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(approvalId)) return false;
  const query = supabase.from("approval_requests").select("status, action_label, decided_by, requester_id, user_id, updated_at").eq("id", approvalId);
  const { data, error } = await applyUserOrOrgScope(query, userId, orgId).maybeSingle();
  return !error && approvalMatchesExecution(data, playbook);
}
