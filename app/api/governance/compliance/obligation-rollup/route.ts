import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildObligationExecutiveRollupHtml,
  buildObligationExecutiveRollupPack,
  obligationExecutiveRollupToCsv,
} from "@/lib/compliance/obligation-executive-rollup";
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
  const horizonRaw = req.nextUrl.searchParams.get("horizonDays");
  const horizonDays = horizonRaw ? Number.parseInt(horizonRaw, 10) : 90;
  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";

  const pack = await buildObligationExecutiveRollupPack(user.id, {
    orgId: orgContext.orgId,
    orgName: orgContext.orgName,
    horizonDays: Number.isFinite(horizonDays) ? horizonDays : 90,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build obligation executive rollup." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.obligation_executive_rollup_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      horizon_days: pack.horizonDays,
      total_obligations: pack.forecast?.totalForecastObligations ?? 0,
      crossover_clusters: pack.crossover?.crossoverClusterCount ?? 0,
      sla_overdue: pack.sla?.overdueCount ?? 0,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "html") {
    const html = buildObligationExecutiveRollupHtml({
      orgName: pack.orgName,
      horizonDays: pack.horizonDays,
      generatedAt: pack.generatedAt,
      forecast: pack.forecast,
      crossover: pack.crossover,
      consolidation: pack.consolidation,
      sla: pack.sla,
      boardSummary: pack.boardSummary,
    });
    return new NextResponse(html, {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="obligation-executive-rollup-${stamp}.html"`,
      },
    });
  }

  if (format === "csv") {
    return new NextResponse(obligationExecutiveRollupToCsv(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="obligation-executive-rollup-${stamp}.csv"`,
      },
    });
  }

  return NextResponse.json(pack, {
    status: 200,
    headers: {
      ...OPERATIONAL_RESPONSE_HEADERS,
      "Content-Disposition": `attachment; filename="obligation-executive-rollup-${stamp}.json"`,
    },
  });
}
