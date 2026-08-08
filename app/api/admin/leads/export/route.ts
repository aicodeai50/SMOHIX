import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { logEvent } from "@/lib/observability/logger";
import { buildCsvContent } from "@/lib/revops/csv";
import { listLeadsForExport } from "@/lib/revops/leads";
import { parseLeadStatus } from "@/lib/revops/types";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const { searchParams } = req.nextUrl;
  const inquiryType = searchParams.get("inquiry_type");
  const status = parseLeadStatus(searchParams.get("status"));
  const search = searchParams.get("q");

  const rows = await listLeadsForExport({ inquiryType, status, search });
  const exportedAt = new Date().toISOString();

  const csv = buildCsvContent(
    [
      "reference_id",
      "created_at",
      "status",
      "priority",
      "name",
      "email",
      "company",
      "inquiry_type",
      "source",
      "assigned_to",
      "follow_up_date",
      "next_action",
    ],
    rows.map((r) => [
      r.public_reference,
      r.created_at,
      r.status,
      r.priority,
      r.name,
      r.email,
      r.company,
      r.inquiry_type,
      r.source_label ?? r.source_path,
      r.assigned_to,
      r.follow_up_date,
      r.next_action,
    ]),
    exportedAt,
  );

  logEvent("info", "leads_csv_export", {
    actorDomain: auth.email.split("@")[1],
    rowCount: rows.length,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="smohix-leads-${exportedAt.slice(0, 10)}.csv"`,
    },
  });
}
