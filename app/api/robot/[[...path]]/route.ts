import type { NextRequest } from "next/server";
import { proxyToUpstream } from "@/lib/upstream-proxy";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ path?: string[] }> };

/** Client: `fetch("/api/robot/health")` → `${REACT_APP_ROBOT_BACKEND}/health` */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  return proxyToUpstream("robot", req, path);
}
export async function POST(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  return proxyToUpstream("robot", req, path);
}
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  return proxyToUpstream("robot", req, path);
}
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  return proxyToUpstream("robot", req, path);
}
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  return proxyToUpstream("robot", req, path);
}
