import { NextResponse } from "next/server";
import { getConnectorHealthRows } from "@/lib/connectors-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side snapshot of reasoning + robot reachability.
 * The browser calls this same-origin URL; secrets stay on the server.
 */
export async function GET() {
  const connectors = await getConnectorHealthRows();
  return NextResponse.json({ connectors });
}
