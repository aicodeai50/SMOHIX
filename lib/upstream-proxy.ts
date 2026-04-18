import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { devResolveTenantFromPlainKey } from "@/lib/api-keys/dev-store";
import {
  extractShynvoApiKey,
  resolveUserIdFromApiKeyPlaintext,
} from "@/lib/api-keys/resolve";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { clientIpFromRequest, takeToken } from "@/lib/rate-limit/memory";

const TIMEOUT_MS = 60_000;
const PROXY_RATE_LIMIT = 120;
const PROXY_RATE_WINDOW_MS = 60_000;

async function resolveProxyUserId(req: NextRequest): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return user.id;
  }
  const plain = extractShynvoApiKey(req);
  if (!plain) {
    return null;
  }
  return resolveUserIdFromApiKeyPlaintext(plain);
}

/** When Supabase auth env is set, proxy allows a session cookie or a valid `shynvo_sk_` API key. */
async function denyIfProxyUnauthenticated(
  req: NextRequest,
): Promise<NextResponse | null> {
  if (!hasSupabaseAuth()) {
    return null;
  }
  try {
    const userId = await resolveProxyUserId(req);
    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Sign in, or call with Authorization: Bearer <shynvo_sk_…> or X-Shynvo-Api-Key (see Settings → API keys). API key validation needs SUPABASE_SERVICE_ROLE_KEY on the server.",
        },
        { status: 401 },
      );
    }
    const ip = clientIpFromRequest(req);
    const rl = takeToken(
      `proxy:${userId}:${ip}`,
      PROXY_RATE_LIMIT,
      PROXY_RATE_WINDOW_MS,
    );
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too_many_requests", retry_after: rl.retryAfterSec },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        },
      );
    }
  } catch {
    return NextResponse.json(
      {
        error: "Auth_unavailable",
        message: "Could not validate session for this request.",
      },
      { status: 503 },
    );
  }
  return null;
}

/** No Supabase auth: anonymous IP limit, or per-tenant limit when a valid demo API key is sent. */
function denyIfProxyDevOrAnon(req: NextRequest): NextResponse | null {
  if (hasSupabaseAuth()) {
    return null;
  }
  const ip = clientIpFromRequest(req);
  const plain = extractShynvoApiKey(req);
  if (plain) {
    const dev = devResolveTenantFromPlainKey(plain);
    if (!dev) {
      return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
    }
    const rl = takeToken(
      `proxy:dev:${dev.tenantId}:${ip}`,
      PROXY_RATE_LIMIT,
      PROXY_RATE_WINDOW_MS,
    );
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too_many_requests", retry_after: rl.retryAfterSec },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        },
      );
    }
    return null;
  }
  const rl = takeToken(`proxy:anon:${ip}`, PROXY_RATE_LIMIT, PROXY_RATE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too_many_requests", retry_after: rl.retryAfterSec },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }
  return null;
}

function baseUrl(kind: "reasoning" | "robot"): string | null {
  const raw =
    kind === "reasoning"
      ? process.env.SHYNVO_REASONING_API_URL
      : process.env.SHYNVO_ROBOT_API_URL;
  const t = raw?.trim().replace(/\/+$/, "");
  return t || null;
}

/** Reject path traversal and odd segments. */
function safeJoinPath(segments: string[] | undefined): string {
  if (!segments?.length) return "";
  for (const s of segments) {
    if (s.includes("..") || s.includes("/") || s.includes("\\")) {
      throw new Error("invalid_path");
    }
  }
  return "/" + segments.join("/");
}

function pickForwardHeaders(req: NextRequest): Headers {
  const out = new Headers();
  for (const name of ["content-type", "accept"] as const) {
    const v = req.headers.get(name);
    if (v) {
      out.set(name, v);
    }
  }
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();
    if (token && !token.startsWith("shynvo_sk_")) {
      out.set("authorization", auth);
    }
  }
  return out;
}

export async function proxyToUpstream(
  kind: "reasoning" | "robot",
  req: NextRequest,
  pathSegments: string[] | undefined,
): Promise<NextResponse> {
  const devOrAnon = denyIfProxyDevOrAnon(req);
  if (devOrAnon) {
    return devOrAnon;
  }

  const authDeny = await denyIfProxyUnauthenticated(req);
  if (authDeny) {
    return authDeny;
  }

  const base = baseUrl(kind);
  if (!base) {
    const label = kind === "reasoning" ? "Reasoning" : "Automation";
    return NextResponse.json(
      { error: `${label} service is not connected (missing URL in environment).` },
      { status: 503 },
    );
  }

  let suffix: string;
  try {
    suffix = safeJoinPath(pathSegments);
  } catch {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const target = `${base}${suffix}`;
  const url = new URL(target);
  req.nextUrl.searchParams.forEach((v, k) => {
    url.searchParams.set(k, v);
  });

  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const headers = pickForwardHeaders(req);

  try {
    const upstream = await fetch(url.toString(), {
      method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const resHeaders = new Headers();
    const pass = ["content-type", "cache-control"];
    for (const h of pass) {
      const v = upstream.headers.get(h);
      if (v) resHeaders.set(h, v);
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: resHeaders,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "upstream_fetch_failed", detail: msg }, { status: 502 });
  }
}
