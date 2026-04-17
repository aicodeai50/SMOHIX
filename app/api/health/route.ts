import { NextResponse } from "next/server";

/** Lightweight health check for load balancers (e.g. Railway). */
export async function GET() {
  return NextResponse.json({ ok: true, service: "shynvo-web" }, { status: 200 });
}
