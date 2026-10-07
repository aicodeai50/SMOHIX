import { NextResponse } from "next/server";

import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Postgres readiness via Supabase RPC `zentro_db_health`.
 * Separate from GET /api/health so Railway liveness stays dependency-free.
 */
export async function GET() {
  const admin = createServiceSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        service: "smohix-db",
        error: "database_unavailable",
      },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  try {
    const { data, error } = await admin.rpc("zentro_db_health");
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          service: "smohix-db",
          error: "database_unavailable",
        },
        { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
      );
    }

    const payload = data as { ok?: boolean } | null;

    return NextResponse.json(
      {
        ok: payload?.ok === true,
        service: "smohix-db",
      },
      {
        status: payload?.ok === true ? 200 : 503,
        headers: OPERATIONAL_RESPONSE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json({ ok: false, service: "smohix-db", error: "database_unavailable" }, { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS });
  }
}
