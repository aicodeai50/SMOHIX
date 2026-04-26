import { NextResponse } from "next/server";

import { getServiceSloSummary } from "@/lib/services/slo";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      { error: "Not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }
  const { id } = await ctx.params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const summary = await getServiceSloSummary(supabase, user.id, id);
  if (!summary) {
    return NextResponse.json(
      { error: "Not found." },
      { status: 404, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }
  return NextResponse.json({ summary }, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
}
