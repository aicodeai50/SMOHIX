import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildObligationDensityTrendHistoryPack,
  obligationDensityTrendHistoryToCsv,
} from "@/lib/compliance/obligation-density-trend-history";
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
  const trailingRaw = req.nextUrl.searchParams.get("trailingDays");
  const trailingDays = trailingRaw ? Number.parseInt(trailingRaw, 10) : 90;
  const format = req.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "json";

  const pack = await buildObligationDensityTrendHistoryPack(user.id, {
    orgId: orgContext.orgId,
    trailingDays: Number.isFinite(trailingDays) ? trailingDays : 90,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build obligation density trend history." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.obligation_density_trend_history_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      trailing_days: pack.trailingDays,
      week_count: pack.weekKeys.length,
      peak_trailing_count: pack.peakTrailingCount,
      total_alert_deliveries: pack.totalAlertDeliveries,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "csv") {
    return new NextResponse(obligationDensityTrendHistoryToCsv(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="obligation-density-trend-${stamp}.csv"`,
      },
    });
  }

  return NextResponse.json(pack, {
    status: 200,
    headers: OPERATIONAL_RESPONSE_HEADERS,
  });
}
