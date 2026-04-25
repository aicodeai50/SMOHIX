import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getPolicyBlockSummaryForUser, type PolicyBlockWindow } from "@/lib/approvals/policy-block-analytics";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeWindow(raw: string | null): PolicyBlockWindow {
  return raw?.toLowerCase() === "30d" ? "30d" : "7d";
}

export async function GET(req: NextRequest) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      { error: "Not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

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

  const window = normalizeWindow(req.nextUrl.searchParams.get("window"));
  const summary = await getPolicyBlockSummaryForUser(supabase, user.id, window);
  return NextResponse.json(
    { summary },
    {
      status: 200,
      headers: OPERATIONAL_RESPONSE_HEADERS,
    },
  );
}
