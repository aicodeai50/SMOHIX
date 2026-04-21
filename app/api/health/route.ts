import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Liveness for Railway / load balancers. No DB, no upstream calls — must stay fast.
 * @see https://docs.railway.com/deployments/healthchecks
 */

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "shynvo-web",
      uptime_s: Math.round(process.uptime()),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "X-Frame-Options": "DENY",
        "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    },
  );
}

/** Some probes use HEAD — respond without a body. */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
