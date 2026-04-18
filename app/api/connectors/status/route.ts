import { NextResponse } from "next/server";
import { getConnectorHealthRows } from "@/lib/connectors-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side snapshot of reasoning + automation reachability.
 * Same-origin for browsers; secrets stay on the server.
 */
export async function GET() {
  const connectors = await getConnectorHealthRows();
  return NextResponse.json({ connectors });
}
