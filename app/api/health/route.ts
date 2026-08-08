import { NextResponse } from "next/server";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";

export const runtime = "nodejs";

/**
 * Liveness for Railway / load balancers. No DB, no upstream calls — must stay fast.
 * @see https://docs.railway.com/deployments/healthchecks
 */

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "smohix-web",
      uptime_s: Math.round(process.uptime()),
    },
    {
      status: 200,
      headers: OPERATIONAL_RESPONSE_HEADERS,
    },
  );
}

/** Some probes use HEAD — respond without a body. */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: OPERATIONAL_RESPONSE_HEADERS,
  });
}
