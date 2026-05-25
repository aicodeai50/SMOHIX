import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { appendAuditEvent } from "@/lib/audit/append";
import {
  buildBoardObligationWhatIfPack,
  buildCustomWhatIfScenario,
  boardObligationWhatIfToCsv,
  OBLIGATION_WHATIF_SCENARIOS,
  parseWhatIfFrameworksParam,
} from "@/lib/compliance/board-obligation-whatif";
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

  const shiftRaw = req.nextUrl.searchParams.get("shiftWeeks");
  const shiftWeeks = shiftRaw ? Number.parseInt(shiftRaw, 10) : NaN;
  const excludeFrameworks = parseWhatIfFrameworksParam(
    req.nextUrl.searchParams.get("excludeFrameworks"),
  );
  const excludeVendor = req.nextUrl.searchParams.get("excludeVendor") === "1";

  let scenarios = OBLIGATION_WHATIF_SCENARIOS;
  if (
    Number.isFinite(shiftWeeks) ||
    excludeFrameworks.length > 0 ||
    excludeVendor
  ) {
    scenarios = [
      buildCustomWhatIfScenario({
        shiftWeeks: Number.isFinite(shiftWeeks) ? shiftWeeks : 0,
        excludedFrameworks: excludeFrameworks,
        excludeVendor,
      }),
      ...OBLIGATION_WHATIF_SCENARIOS,
    ];
  }

  const pack = await buildBoardObligationWhatIfPack(user.id, {
    orgId: orgContext.orgId,
    horizonDays: Number.isFinite(horizonDays) ? horizonDays : 90,
    scenarios,
    supabase,
  });

  if (!pack) {
    return NextResponse.json(
      { error: "Could not build board obligation what-if pack." },
      { status: 500, headers: OPERATIONAL_RESPONSE_HEADERS },
    );
  }

  await appendAuditEvent({
    event_type: "governance.board_obligation_whatif_exported",
    user_id: user.id,
    org_id: orgContext.orgId,
    details: {
      format,
      horizon_days: pack.horizonDays,
      scenario_count: pack.results.length,
      baseline_peak: pack.baseline.peakWeekCount,
      best_relief: pack.bestReliefScenarioId,
    },
  });

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  if (format === "csv") {
    return new NextResponse(boardObligationWhatIfToCsv(pack), {
      status: 200,
      headers: {
        ...OPERATIONAL_RESPONSE_HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="obligation-whatif-${stamp}.csv"`,
      },
    });
  }

  return NextResponse.json(pack, {
    status: 200,
    headers: OPERATIONAL_RESPONSE_HEADERS,
  });
}
