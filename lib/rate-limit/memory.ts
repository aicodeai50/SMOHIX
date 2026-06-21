type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const PRUNE_EVERY = 500;

function prune(now: number) {
  if (store.size < PRUNE_EVERY) return;
  for (const [k, v] of store) {
    if (v.resetAt < now) store.delete(k);
  }
}

type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

async function takeTokenFromUpstash(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  const base = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/+$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!base || !token) {
    return null;
  }

  const redisKey = `rl:${key}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  try {
    const res = await fetch(`${base}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec, "NX"],
        ["TTL", redisKey],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as { result?: unknown }[];
    const count = Number(json[0]?.result ?? 0);
    const ttl = Math.max(1, Number(json[2]?.result ?? windowSec));
    if (count > limit) {
      return { ok: false, retryAfterSec: ttl };
    }
    return { ok: true };
  } catch {
    return null;
  }
}

function takeTokenFromMemory(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
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

/**
 * Fixed-window counter. Uses Upstash Redis REST when configured, otherwise falls
 * back to process memory for single-instance local/dev deployments.
 */
export async function takeToken(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  return (await takeTokenFromUpstash(key, limit, windowMs)) ?? takeTokenFromMemory(key, limit, windowMs);
}

export function clientIpFromRequest(request: Request): string {
  const h = (name: string) => request.headers.get(name)?.trim();
  const xff = h("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "unknown";
  }
  return h("x-real-ip") || "unknown";
}
