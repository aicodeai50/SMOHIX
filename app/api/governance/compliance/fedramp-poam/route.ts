import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildFedrampPoamPack,
  fedrampPoamToCsv,
} from "@/lib/compliance/fedramp-poam";
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
  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "csv";

  const pack = await buildFedrampPoamPack(user.id, {
    periodDays: Number.isFinite(periodDays) ? periodDays : 30,
    orgId: orgContext.orgId,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build FedRAMP POA&M pack." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.fedramp_poam_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      period_days: pack.periodDays,
      poam_row_count: pack.poamRowCount,
      gap_source_count: pack.gapSourceCount,
      unmapped_gap_count: pack.unmappedGapCount,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "json") {
    return NextResponse.json(pack, {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Disposition": `attachment; filename="fedramp-poam-${stamp}.json"`,
      },
    });
  }

  const csv = fedrampPoamToCsv(pack);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      ...OPERATIONAL_RESPONSE_HEADERS,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fedramp-poam-${stamp}.csv"`,
    },
  });
}
