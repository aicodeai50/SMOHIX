import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import { buildComplianceCommitteeMeetingPackZip } from "@/lib/compliance/compliance-committee-meeting-pack";
import { getOrgContextForUser } from "@/lib/org/context";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const periodRaw = req.nextUrl.searchParams.get("periodDays");
  const periodDays = periodRaw ? Number.parseInt(periodRaw, 10) : 30;

  const result = await buildComplianceCommitteeMeetingPackZip(user.id, {
    periodDays: Number.isFinite(periodDays) ? periodDays : 30,
    orgId: orgContext.orgId,
    orgName: orgContext.orgName,
    supabase,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Could not build committee meeting pack." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.compliance_committee_meeting_pack_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      period_days: result.manifest.periodDays,
      file_count: result.manifest.fileCount,
      manifest_sha256: result.manifest.manifestSha256,
    },
  });

  return new NextResponse(result.zip as unknown as BodyInit, {
    status: 200,
    headers: {
      ...OPERATIONAL_RESPONSE_HEADERS,
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}
