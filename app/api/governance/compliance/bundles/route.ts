import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { auditWindowToSinceIso } from "@/lib/audit/export-window";
import { createEvidenceBundle, listEvidenceBundlesForOrg } from "@/lib/compliance/evidence-bundle";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function siteOrigin(req: NextRequest): string {
  const env = process.env.ZENTRO_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://zentro.run";
}

export async function GET() {
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
      { error: "No active organization." },
      { status: 404, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  const bundles = await listEvidenceBundlesForOrg(orgContext.orgId, { supabase });
  return NextResponse.json({ bundles }, { status: 200, headers: OPERATIONAL_RESPONSE_HEADERS });
}

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
      { error: "Only org owners and admins can create evidence bundles." },
      { status: 403, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }
  if (orgContext.role === "auditor") {
    return NextResponse.json(
      { error: "Auditor role is read-only." },
      { status: 403, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  let windowParam: string | null = "30d";
  try {
    const body = (await req.json()) as { window?: string };
    windowParam = body.window ?? "30d";
  } catch {
    windowParam = req.nextUrl.searchParams.get("window");
  }
  auditWindowToSinceIso(windowParam);

  const result = await createEvidenceBundle(user.id, orgContext.orgId, {
    windowParam,
    siteOrigin: siteOrigin(req),
    supabase,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.evidence_bundle_created",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      bundle_id: result.bundle.id,
      manifest_sha256: result.bundle.manifestSha256,
      window: result.bundle.windowLabel,
      webhook_delivered: result.webhookDelivered,
      delivery_status: result.bundle.deliveryStatus,
    },
  });

  return NextResponse.json(
    { bundle: result.bundle, webhookDelivered: result.webhookDelivered },
    { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}
