import { NextResponse } from "next/server";
import { clientIpFromRequest, takeToken } from "@/lib/rate-limit/memory";
import { fetchProductStatuses } from "@/lib/status/adapters";
import { acquireStatusConnection, createPublicStatusStream } from "@/lib/status/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const key = clientIpFromRequest(request);
  const limit = await takeToken(`public-status-stream:${key}`, 12, 60_000);
  if (!limit.ok) return NextResponse.json({ error: "too_many_requests" }, {
    status: 429, headers: { "Retry-After": String(limit.retryAfterSec), "Cache-Control": "no-store" },
  });
  const release = acquireStatusConnection(key);
  if (!release) return NextResponse.json({ error: "stream_busy" }, {
    status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" },
  });
  return new Response(createPublicStatusStream(request.signal, fetchProductStatuses, { onClose: release }), {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
