import { NextResponse } from "next/server";
import { getConnectorHealthRows } from "@/lib/connectors-health";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
  "Cross-Origin-Resource-Policy": "same-origin",
} as const;

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
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: PRIVATE_HEADERS });
    }
  }

  const connectors = await getConnectorHealthRows();
  return NextResponse.json(
    { connectors },
    {
      headers: PRIVATE_HEADERS,
    },
  );
}
