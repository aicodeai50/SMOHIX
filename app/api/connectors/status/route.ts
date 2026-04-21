import { NextResponse } from "next/server";
import { getConnectorHealthRows } from "@/lib/connectors-health";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side snapshot of reasoning + automation reachability.
 * Same-origin for browsers; secrets stay on the server.
 */
export async function GET() {
  if (hasSupabaseAuth()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS });
    }
  }

  const connectors = await getConnectorHealthRows();
  return NextResponse.json(
    { connectors },
    {
      headers: OPERATIONAL_RESPONSE_HEADERS,
    },
  );
}
