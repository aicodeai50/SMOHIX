import { redirect } from "next/navigation";

import { createBillingCheckout } from "@/lib/billing";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasSupabaseAuth()) {
    return Response.json({ error: "Auth not configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tier?: string; topUpAmountCents?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tier = body.tier?.trim();
  if (tier !== "pro" && tier !== "team" && tier !== "top_up") {
    return Response.json({ error: "Invalid tier" }, { status: 400 });
  }

  const result = await createBillingCheckout({
    userId: user.id,
    tier,
    topUpAmountCents: body.topUpAmountCents,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 502 });
  }

  return Response.json({
    approvalUrl: result.approvalUrl,
    resourceId: result.resourceId,
    kind: result.kind,
  });
}

/** GET redirects to PayPal approval URL (for link-based checkout from billing page) */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tier = url.searchParams.get("tier")?.trim();

  if (tier !== "pro" && tier !== "team" && tier !== "top_up") {
    return Response.json({ error: "Invalid tier" }, { status: 400 });
  }

  if (!hasSupabaseAuth()) {
    redirect("/auth/sign-in?next=/settings/billing");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/settings/billing");
  }

  const topUpParam = url.searchParams.get("amount");
  const topUpAmountCents = topUpParam ? Math.round(Number(topUpParam) * 100) : undefined;

  const result = await createBillingCheckout({
    userId: user.id,
    tier,
    topUpAmountCents,
  });

  if (!result.ok) {
    redirect(`/settings/billing?error=${encodeURIComponent(result.error)}`);
  }

  redirect(result.approvalUrl);
}
