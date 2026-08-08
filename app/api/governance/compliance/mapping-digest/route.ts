import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildCurrentMappingSnapshot,
  computeMappingChanges,
  buildRegulatoryMappingDigestPayload,
  getLatestMappingSnapshot,
  runRegulatoryMappingDigestForOrg,
  regulatoryMappingDigestToJson,
} from "@/lib/compliance/regulatory-mapping-change-digest";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteOrigin(req: NextRequest): string {
  const env = (process.env.SMOHIX_SITE_URL ?? process.env.ZENTRO_SITE_URL)?.trim();
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://smohix.run";
}

/** Preview current mapping fingerprint and pending changes vs last snapshot. */
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

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId) {
    return NextResponse.json(
      { error: "Organization required." },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const current = buildCurrentMappingSnapshot();
  const previous = await getLatestMappingSnapshot(orgContext.orgId, { supabase });
  const deltas = computeMappingChanges(previous, current);
  const digest = buildRegulatoryMappingDigestPayload(
    orgContext.orgId,
    current,
    deltas,
    siteOrigin(req),
  );

  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";
  if (format === "json") {
    return new NextResponse(regulatoryMappingDigestToJson(digest), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  return NextResponse.json(
    { snapshot: current, previousSnapshot: previous, digest },
    { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}

/** Run mapping change digest (webhook/email when changes detected). */
export async function POST(req: NextRequest) {
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

  const orgContext = await getOrgContextForUser(user.id);
  if (!orgContext.orgId || !orgContext.role || !canManageMembers(orgContext.role)) {
    return NextResponse.json(
      { error: "Forbidden." },
      { status: 403, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  let forceNotify = false;
  try {
    const body = (await req.json().catch(() => ({}))) as { forceNotify?: boolean };
    forceNotify = Boolean(body.forceNotify);
  } catch {
    /* empty body ok */
  }

  const result = await runRegulatoryMappingDigestForOrg(user.id, orgContext.orgId, {
    siteOrigin: siteOrigin(req),
    supabase,
    forceNotify,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.regulatory_mapping_digest_delivered",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      delivery_id: result.delivery.id,
      change_count: result.digest.deltas.changeCount,
      webhook_delivered: result.webhookDelivered,
      emails_sent: result.emailsSent,
    },
  });

  return NextResponse.json(
    {
      delivery: result.delivery,
      webhookDelivered: result.webhookDelivered,
      emailsSent: result.emailsSent,
      digest: result.digest,
    },
    { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}
