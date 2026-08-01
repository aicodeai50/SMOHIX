import { NextResponse } from "next/server";

import { loadRevOpsDashboard } from "@/lib/revops/dashboard";
import { requirePlatformAdmin } from "@/lib/platform/admin";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requirePlatformAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  }

  const dashboard = await loadRevOpsDashboard();
  return NextResponse.json(dashboard);
}
