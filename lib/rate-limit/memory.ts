type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const PRUNE_EVERY = 500;

function prune(now: number) {
  if (store.size < PRUNE_EVERY) return;
  for (const [k, v] of store) {
    if (v.resetAt < now) store.delete(k);
  }
}

/**
 * Fixed-window counter (in-memory). Fine for single Node instances; use Redis at scale.
 */
export function takeToken(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);

  let b = store.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    store.set(key, b);
  }

  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }

  b.count += 1;
  return { ok: true };
}

export function clientIpFromRequest(request: Request): string {
  const h = (name: string) => request.headers.get(name)?.trim();
  const xff = h("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "unknown";
  }
  return h("x-real-ip") || "unknown";
}
