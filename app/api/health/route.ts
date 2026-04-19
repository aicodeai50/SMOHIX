import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Liveness for Railway / load balancers. No DB, no upstream calls — must stay fast.
 * @see https://docs.railway.com/deployments/healthchecks
 */
function deployCommit(): string | undefined {
  const v =
    process.env.RAILWAY_GIT_COMMIT_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GIT_COMMIT?.trim();
  return v || undefined;
}

export async function GET() {
  const commit = deployCommit();
  return NextResponse.json(
    {
      ok: true,
      service: "shynvo-web",
      uptime_s: Math.round(process.uptime()),
      ...(commit ? { commit } : {}),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

/** Some probes use HEAD — respond without a body. */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
