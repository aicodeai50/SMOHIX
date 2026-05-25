import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { listAuditEntriesForCsvExport } from "@/lib/audit/data";
import { escapeCsvField } from "@/lib/audit/csv-escape";
import { auditSinceIsoFromWindow, auditWindowToSinceIso } from "@/lib/audit/export-window";
import { canExportOrgAuditLog } from "@/lib/audit/role-filter";
import { getOrgContextForUser } from "@/lib/org/context";
import { OPERATIONAL_RESPONSE_HEADERS } from "@/lib/security/operational-headers";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!hasSupabaseAuth()) {
    return NextResponse.json({ error: "Not configured." }, { status: 503, headers: OPERATIONAL_RESPONSE_HEADERS });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401, headers: OPERATIONAL_RESPONSE_HEADERS });
  }

  const orgContext = await getOrgContextForUser(user.id);
  if (!canExportOrgAuditLog(orgContext.role)) {
    return NextResponse.json({ error: "Export not permitted for your role." }, { status: 403, headers: OPERATIONAL_RESPONSE_HEADERS });
  }

  const windowNorm = auditWindowToSinceIso(req.nextUrl.searchParams.get("window"));
  const sinceIso = auditSinceIsoFromWindow(windowNorm);

  const rows = await listAuditEntriesForCsvExport(user.id, {
    sinceIso,
    orgId: orgContext.orgId,
    orgRole: orgContext.role,
  });
  const header = ["time_utc", "event_type", "actor", "incident_id", "details_json"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.created_at, r.event_type, r.actor, r.incident_id, r.details_json]
        .map((c) => escapeCsvField(c))
        .join(","),
    ),
  ];
  const csv = `${lines.join("\n")}\n`;
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `audit-${windowNorm}-${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      ...OPERATIONAL_RESPONSE_HEADERS,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
