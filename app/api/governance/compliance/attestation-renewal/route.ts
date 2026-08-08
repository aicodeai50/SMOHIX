import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  attestationRenewalCalendarToCsv,
  buildAttestationRenewalCalendarPack,
  getAttestationRenewalOrgSettings,
  runAttestationRenewalNudgesForOrg,
} from "@/lib/compliance/attestation-renewal-calendar";
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
  const horizonRaw = req.nextUrl.searchParams.get("horizonDays");
  const horizonDays = horizonRaw ? Number.parseInt(horizonRaw, 10) : undefined;
  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";

  const settings = orgContext.orgId
    ? await getAttestationRenewalOrgSettings(orgContext.orgId, supabase)
    : null;

  const pack = await buildAttestationRenewalCalendarPack(user.id, {
    orgId: orgContext.orgId,
    horizonDays: Number.isFinite(horizonDays) ? horizonDays : settings?.horizonDays,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build attestation renewal calendar." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.attestation_renewal_calendar_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      horizon_days: pack.horizonDays,
      wave_count: pack.waveCount,
      total_renewals: pack.totalRenewals,
      overdue_count: pack.overdueCount,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "csv") {
    return new NextResponse(attestationRenewalCalendarToCsv(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attestation-renewal-${stamp}.csv"`,
      },
    });
  }

  return NextResponse.json(
    { settings, pack },
    {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Disposition": `attachment; filename="attestation-renewal-${stamp}.json"`,
      },
    },
  );
}

/** Send owner renewal nudges for current waves (org admins). */
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

  const result = await runAttestationRenewalNudgesForOrg(user.id, orgContext.orgId, {
    siteOrigin: siteOrigin(req),
    orgName: orgContext.orgName ?? undefined,
    supabase,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason },
      { status: 400, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.attestation_renewal_nudges_sent",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      emails_sent: result.emailsSent,
      emails_skipped: result.emailsSkipped,
      owners_considered: result.ownersConsidered,
      controls_notified: result.controlsNotified,
    },
  });

  return NextResponse.json(result, { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS });
}
