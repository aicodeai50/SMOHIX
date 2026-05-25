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
        service: "zentro-db",
        error: "supabase_not_configured",
      },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const { data, error } = await admin.rpc("zentro_db_health");
  if (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "zentro-db",
        error: error.message,
      },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const payload = data as { ok?: boolean; postgres_version?: string; server_time?: string } | null;

  return NextResponse.json(
    {
      ok: payload?.ok === true,
      service: "zentro-db",
      postgres_version: payload?.postgres_version ?? null,
      server_time: payload?.server_time ?? null,
    },
    {
      status: payload?.ok === true ? 200 : 503,
      headers: OPERATIONAL_RESPONSE_HEADERS,
    },
  );
}
