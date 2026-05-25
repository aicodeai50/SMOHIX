import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { deliverPeakWeekStaffingDigest } from "@/lib/compliance/committee-peak-week-staffing-digest";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteOrigin(req: NextRequest): string {
  const env = process.env.ZENTRO_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://zentro.run";
}

/** Cron: POST with Bearer ZENTRO_PEAK_WEEK_STAFFING_DIGEST_CRON_SECRET. Body: `{ orgId, force? }` */
export async function POST(req: NextRequest) {
  const secret = process.env.ZENTRO_PEAK_WEEK_STAFFING_DIGEST_CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Cron not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  if (!hasSupabaseAuth()) {
    return NextResponse.json(
      { error: "Not configured." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  let orgId = "";
  let force = false;
  try {
    const body = (await req.json()) as { orgId?: string; force?: boolean };
    orgId = String(body.orgId ?? "").trim();
    force = Boolean(body.force);
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  if (!orgId) {
    return NextResponse.json(
      { error: "orgId required." },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const admin = createServiceSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Service role unavailable." },
      { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const { data: owner } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  const actorId = (owner?.user_id as string | null) ?? null;
  if (!actorId) {
    return NextResponse.json(
      { error: "No org owner found." },
      { status: 404, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const result = await deliverPeakWeekStaffingDigest(actorId, orgId, {
    siteOrigin: siteOrigin(req),
    supabase: admin,
    scheduled: true,
    force,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  return NextResponse.json(result, { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS });
}
