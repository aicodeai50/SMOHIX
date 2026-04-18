import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { hasSupabaseAuth } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const TIMEOUT_MS = 60_000;

/** When Supabase auth env is set, same-origin proxy requires a signed-in user. */
async function denyIfProxyUnauthenticated(): Promise<NextResponse | null> {
  if (!hasSupabaseAuth()) {
    return null;
  }
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Sign in to use the reasoning and automation APIs.",
        },
        { status: 401 },
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
  const allow = ["content-type", "accept", "authorization"];
  for (const name of allow) {
    const v = req.headers.get(name);
    if (v) out.set(name, v);
  }
  return out;
}

export async function proxyToUpstream(
  kind: "reasoning" | "robot",
  req: NextRequest,
  pathSegments: string[] | undefined,
): Promise<NextResponse> {
  const authDeny = await denyIfProxyUnauthenticated();
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
