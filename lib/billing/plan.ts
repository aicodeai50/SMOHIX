import type { SupabaseClient } from "@supabase/supabase-js";

/** Paid access when Lemon subscription row is in a non-terminal state. */
const PAID_STATUSES = new Set([
  "on_trial",
  "active",
  "paused",
  "past_due",
  "unpaid",
]);

export type BillingPlan = "free" | "paid";

export async function getBillingPlanForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<BillingPlan> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.status) {
    return "free";
  }

  return PAID_STATUSES.has(String(data.status).toLowerCase()) ? "paid" : "free";
}
