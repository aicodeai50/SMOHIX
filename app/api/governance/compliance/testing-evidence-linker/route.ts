import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildControlTestingEvidenceLinkerPack,
  controlTestingEvidenceLinkerToCsv,
  materializeTestingEvidenceLinksForExport,
} from "@/lib/compliance/control-testing-evidence-linker";
import { getOrgContextForUser } from "@/lib/org/context";
import { canManageMembers } from "@/lib/org/roles";
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
  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";

  const pack = await buildControlTestingEvidenceLinkerPack(user.id, {
    orgId: orgContext.orgId,
    periodDays: Number.isFinite(periodDays) ? periodDays : 30,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build control testing evidence linker." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.control_testing_evidence_linker_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      period_days: pack.periodDays,
      link_count: pack.linkCount,
      linked_to_bundle_count: pack.linkedToBundleCount,
      dry_run_count: pack.dryRunCount,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "csv") {
    return new NextResponse(controlTestingEvidenceLinkerToCsv(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="testing-evidence-links-${stamp}.csv"`,
      },
    });
  }

  return NextResponse.json(pack, {
    status: 200,
    headers: {
      ...OPERATIONAL_RESPONSE_HEADERS,
      "Content-Disposition": `attachment; filename="testing-evidence-links-${stamp}.json"`,
    },
  });
}

/** Record links in audit log for assessor workbook / bundle export trail. */
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

  const pack = await buildControlTestingEvidenceLinkerPack(user.id, {
    orgId: orgContext.orgId,
    periodDays: 30,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build linker pack." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await materializeTestingEvidenceLinksForExport(user.id, orgContext.orgId, pack);

  return NextResponse.json(
    {
      ok: true,
      linkCount: pack.linkCount,
      linkedToBundleCount: pack.linkedToBundleCount,
    },
    { status: 201, headers: OPERATIONAL_RESPONSE_HEADERS },
  );
}
