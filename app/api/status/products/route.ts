import { NextResponse } from 'next/server';
import { clientIpFromRequest, takeToken } from '@/lib/rate-limit/memory';
import { fetchProductStatuses } from '@/lib/status/adapters';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const limit = await takeToken(`public-status:${clientIpFromRequest(request)}`, 20, 60_000);
  if (!limit.ok) return NextResponse.json({ error: 'too_many_requests' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } });
  try {
    const products = await fetchProductStatuses();
    return NextResponse.json({ products }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'status_unavailable' }, { status: 503 });
  }
}
