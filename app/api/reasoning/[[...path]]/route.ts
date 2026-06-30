import type { NextRequest } from "next/server";
import { proxyToUpstream } from "@/lib/upstream-proxy";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path?: string[] }> };

/**
 * Client: `fetch("/api/reasoning/health")` → `${REACT_APP_SH_BACKEND_API}/health`
 * Forwards method, query string, body, Content-Type, Accept, Authorization.
 */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  return proxyToUpstream("reasoning", req, path);
}
export async function POST(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  return proxyToUpstream("reasoning", req, path);
}
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  return proxyToUpstream("reasoning", req, path);
}
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  return proxyToUpstream("reasoning", req, path);
}
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  return proxyToUpstream("reasoning", req, path);
}
