import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { logEvent } from "@/lib/observability/logger";
import { buildCsvContent } from "@/lib/revops/csv";
import { listPilotsForExport } from "@/lib/revops/pilots";
import { parsePilotStatus } from "@/lib/revops/types";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const status = parsePilotStatus(req.nextUrl.searchParams.get("status"));
  const rows = await listPilotsForExport({ status });
  const exportedAt = new Date().toISOString();

  const csv = buildCsvContent(
    [
      "reference_id",
      "created_at",
      "status",
      "name",
      "organization",
      "contact_email",
      "category",
      "owner",
      "start_date",
      "target_review_date",
      "next_action",
    ],
    rows.map((r) => [
      r.public_reference,
      r.created_at,
      r.status,
      r.name,
      r.organization,
      r.contact_email,
      r.category,
      r.owner,
      r.start_date,
      r.target_review_date,
      r.next_action,
    ]),
    exportedAt,
  );

  logEvent("info", "pilots_csv_export", {
    actorDomain: auth.email.split("@")[1],
    rowCount: rows.length,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zentro-pilots-${exportedAt.slice(0, 10)}.csv"`,
    },
  });
}
