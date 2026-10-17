import { parseCheckoutInput, readCheckoutBody, publicCheckoutFailure } from "@/lib/billing/checkout-safety";
import { redirect } from "next/navigation";

import { createBillingCheckout } from "@/lib/billing";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Request could not be verified."},{status:403,headers:{"Cache-Control":"no-store"}});
  if (!hasSupabaseAuth()) {
    return Response.json({ error: "Billing is temporarily unavailable." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let input;
  try { input=parseCheckoutInput(await readCheckoutBody(request)); }
  catch { return Response.json({error:"Could not read this checkout request."},{status:400,headers:{"Cache-Control":"no-store"}}); }
  if(!input)return Response.json({error:"Check the selected plan and top-up amount."},{status:400,headers:{"Cache-Control":"no-store"}});

  const result = await createBillingCheckout({
    userId: user.id,
    ...input,
  });

  if (!result.ok) {
    return Response.json({ error: publicCheckoutFailure(result.error) }, { status: 502, headers:{"Cache-Control":"no-store"} });
  }

  return Response.json({
    approvalUrl: result.approvalUrl,
    resourceId: result.resourceId,
    kind: result.kind,
  }, {headers:{"Cache-Control":"no-store"}});
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
  const input=parseCheckoutInput({tier,...(topUpAmountCents!==undefined?{topUpAmountCents}:{})});
  if(!input)redirect("/settings/billing?error=amount");

  const result = await createBillingCheckout({
    userId: user.id,
    tier,
    topUpAmountCents,
  });

  if (!result.ok) {
    redirect("/settings/billing?error=unavailable");
  }

  redirect(result.approvalUrl);
}
