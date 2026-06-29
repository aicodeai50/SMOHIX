import type { SupabaseClient } from "@supabase/supabase-js";

import { notifyOwnApiBilling } from "@/lib/billing/own-api";

/** Paid access when subscription row is in a non-terminal state. */
const PAID_STATUSES = new Set([
  "on_trial",
  "active",
  "paused",
  "past_due",
  "unpaid",
  "APPROVAL_PENDING",
  "APPROVED",
  "ACTIVE",
]);

export type BillingPlan = "free" | "paid";

export type PaidProductTier = "pro" | "team" | "unknown";

export type SubscriptionSummary = {
  status: string;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  lemon_variant_id: string | null;
  lemon_product_id: string | null;
  paypal_subscription_id: string | null;
  paypal_plan_id: string | null;
  updated_at: string;
};

export function billingPlanFromSummary(
  summary: SubscriptionSummary | null,
): BillingPlan {
  if (!summary?.status) {
    return "free";
  }
  return PAID_STATUSES.has(String(summary.status)) ? "paid" : "free";
}

function envPayPalPlan(id: "pro" | "team"): string | undefined {
  const key = id === "pro" ? "PAYPAL_PLAN_ID_PRO" : "PAYPAL_PLAN_ID_TEAM";
  return process.env[key]?.trim() || undefined;
}

export function paidProductTierFromSummary(
  summary: SubscriptionSummary | null,
  plan: BillingPlan,
): PaidProductTier {
  if (plan !== "paid") return "unknown";

  const planId = summary?.paypal_plan_id?.trim();
  const pro = envPayPalPlan("pro");
  const team = envPayPalPlan("team");
  if (planId && pro && planId === pro) return "pro";
  if (planId && team && planId === team) return "team";

  const vid = summary?.lemon_variant_id?.trim();
  const lemonPro = process.env.NEXT_PUBLIC_LEMONSQUEEZY_PRO_VARIANT_ID?.trim();
  const lemonTeam = process.env.NEXT_PUBLIC_LEMONSQUEEZY_TEAM_VARIANT_ID?.trim();
  if (vid && lemonPro && vid === lemonPro) return "pro";
  if (vid && lemonTeam && vid === lemonTeam) return "team";

  return "unknown";
}

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
  error: { message: string; code?: string } | null;
};

export async function getSubscriptionSummary(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string | null,
): Promise<SubscriptionSummaryResult> {
  let query = supabase
    .from("subscriptions")
    .select(
      "status, renews_at, ends_at, trial_ends_at, lemon_variant_id, lemon_product_id, paypal_subscription_id, paypal_plan_id, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(1);

  query = orgId ? query.or(`org_id.eq.${orgId},user_id.eq.${userId}`) : query.eq("user_id", userId);

  const { data, error } = await query.maybeSingle();

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
  orgId?: string | null,
): Promise<BillingPlan> {
  const { summary } = await getSubscriptionSummary(supabase, userId, orgId);
  return billingPlanFromSummary(summary);
}

export type BillingTransaction = {
  id: string;
  type: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string | null;
  invoice_url: string | null;
  created_at: string;
};

export async function getBillingBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ balanceCents: number; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("billing_balance_cents")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { balanceCents: 0, error: error.message };
  }
  return { balanceCents: data?.billing_balance_cents ?? 0, error: null };
}

export async function getBillingTransactions(
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
): Promise<{ transactions: BillingTransaction[]; error: string | null }> {
  const { data, error } = await supabase
    .from("billing_transactions")
    .select("id, type, amount_cents, currency, status, description, invoice_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { transactions: [], error: error.message };
  }
  return { transactions: (data ?? []) as BillingTransaction[], error: null };
}

export type PayPalSubscriptionResource = {
  id?: string;
  status?: string;
  custom_id?: string;
  plan_id?: string;
  billing_info?: {
    next_billing_time?: string;
  };
};

export async function syncPayPalSubscription(
  supabase: SupabaseClient,
  resource: PayPalSubscriptionResource,
): Promise<{ ok: boolean; reason?: string }> {
  const subId = resource.id?.trim();
  const userId = resource.custom_id?.trim();
  const status = resource.status?.trim();

  if (!subId || !userId || !status) {
    return { ok: false, reason: "missing subscription fields" };
  }

  const renewsAt = resource.billing_info?.next_billing_time ?? null;

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      paypal_subscription_id: subId,
      paypal_plan_id: resource.plan_id ?? null,
      lemon_subscription_id: `paypal:${subId}`,
      status: status.toLowerCase(),
      renews_at: renewsAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "lemon_subscription_id" },
  );

  if (error) {
    return { ok: false, reason: error.message };
  }

  const tier = paidProductTierFromSummary(
    {
      status,
      renews_at: renewsAt,
      ends_at: null,
      trial_ends_at: null,
      lemon_variant_id: null,
      lemon_product_id: null,
      paypal_subscription_id: subId,
      paypal_plan_id: resource.plan_id ?? null,
      updated_at: new Date().toISOString(),
    },
    "paid",
  );

  if (status === "ACTIVE" || status === "active") {
    await notifyOwnApiBilling({
      userId,
      type: "subscription_activated",
      tier: tier === "unknown" ? undefined : tier,
      paypalResourceId: subId,
    });
  }

  return { ok: true };
}

export async function recordTopUpCapture(
  supabase: SupabaseClient,
  input: {
    userId: string;
    amountCents: number;
    orderId: string;
    captureId: string;
    currency?: string;
  },
): Promise<{ ok: boolean; reason?: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("billing_balance_cents")
    .eq("id", input.userId)
    .maybeSingle();

  const current = profile?.billing_balance_cents ?? 0;
  const next = current + input.amountCents;

  const { error: txError } = await supabase.from("billing_transactions").insert({
    user_id: input.userId,
    type: "top_up",
    amount_cents: input.amountCents,
    currency: input.currency ?? "USD",
    paypal_order_id: input.orderId,
    paypal_capture_id: input.captureId,
    status: "completed",
    description: "Account balance top-up",
  });

  if (txError) {
    return { ok: false, reason: txError.message };
  }

  const { error: balError } = await supabase
    .from("profiles")
    .update({ billing_balance_cents: next, updated_at: new Date().toISOString() })
    .eq("id", input.userId);

  if (balError) {
    return { ok: false, reason: balError.message };
  }

  await notifyOwnApiBilling({
    userId: input.userId,
    type: "top_up",
    amountCents: input.amountCents,
    paypalResourceId: input.captureId,
  });

  return { ok: true };
}
