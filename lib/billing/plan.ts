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

/** When paid, maps Lemon `variant_id` to a product label (optional env for clarity). */
export type PaidProductTier = "pro" | "team" | "unknown";

export type SubscriptionSummary = {
  status: string;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  lemon_variant_id: string | null;
  lemon_product_id: string | null;
  updated_at: string;
};

export function billingPlanFromSummary(
  summary: SubscriptionSummary | null,
): BillingPlan {
  if (!summary?.status) {
    return "free";
  }
  return PAID_STATUSES.has(String(summary.status).toLowerCase()) ? "paid" : "free";
}

function envVariant(id: "pro" | "team"): string | undefined {
  const key =
    id === "pro"
      ? "NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID"
      : "NEXT_PUBLIC_LEMONSQUEEZY_TEAM_VARIANT_ID";
  const v = process.env[key]?.trim();
  return v || undefined;
}

/** Uses optional public env variant ids to distinguish Pro vs Team on the Billing page. */
export function paidProductTierFromSummary(
  summary: SubscriptionSummary | null,
  plan: BillingPlan,
): PaidProductTier {
  if (plan !== "paid" || !summary?.lemon_variant_id) {
    return "unknown";
  }
  const vid = String(summary.lemon_variant_id).trim();
  const pro = envVariant("pro");
  const team = envVariant("team");
  if (pro && vid === pro) return "pro";
  if (team && vid === team) return "team";
  return "unknown";
}

/** Short label for UI (Billing, etc.). */
export function paidProductDisplayName(
  summary: SubscriptionSummary | null,
  plan: BillingPlan,
): string {
  if (plan === "free") return "Free";
  const tier = paidProductTierFromSummary(summary, plan);
  if (tier === "pro") return "Zentro Pro";
  if (tier === "team") return "Zentro Team";
  return "Paid";
}

export type SubscriptionSummaryResult = {
  summary: SubscriptionSummary | null;
  /** PostgREST / network error (e.g. missing table before migration). */
  error: { message: string; code?: string } | null;
};

/** Latest subscription row for this user (by `updated_at`), if any. */
export async function getSubscriptionSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionSummaryResult> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "status, renews_at, ends_at, trial_ends_at, lemon_variant_id, lemon_product_id, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return {
      summary: null,
      error: { message: error.message, code: error.code },
    };
  }

  if (!data) {
    return { summary: null, error: null };
  }

  return { summary: data as SubscriptionSummary, error: null };
}

export async function getBillingPlanForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<BillingPlan> {
  const { summary } = await getSubscriptionSummary(supabase, userId);
  return billingPlanFromSummary(summary);
}
