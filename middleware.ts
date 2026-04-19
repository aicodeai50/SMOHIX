import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/redirect";
import { isProtectedPath } from "@/lib/auth/paths";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { copyCookies, updateSupabaseSession } from "@/lib/supabase/middleware";

/** Avoid stale HTML after deploy (CDN / browser) for marketing, auth, and console. */
function noStoreHtml(response: NextResponse, pathname: string) {
  const consoleDoc =
    pathname === "/hub" ||
    pathname.startsWith("/vision") ||
    pathname.startsWith("/overview") ||
    pathname.startsWith("/copilot") ||
    pathname.startsWith("/incidents") ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/automations") ||
    pathname.startsWith("/approvals") ||
    pathname.startsWith("/audit") ||
    pathname.startsWith("/runbooks") ||
    pathname.startsWith("/settings");
  const marketing =
    pathname === "/" ||
    pathname === "/platform" ||
    pathname === "/docs" ||
    pathname === "/pricing" ||
    pathname === "/status" ||
    pathname === "/changelog" ||
    pathname === "/why" ||
    pathname === "/integrations";

  if (marketing || pathname.startsWith("/auth/") || consoleDoc) {
    response.headers.set("Cache-Control", "private, no-store, must-revalidate");
    response.headers.set("CDN-Cache-Control", "no-store");
  }
  return response;
}

/**
 * 1) www → apex for the primary host.
 * 2) Supabase session refresh (when env is set).
 * 3) Protect console routes; send signed-in users away from sign-in/up.
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("www.") && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const url = request.nextUrl.clone();
    url.hostname = host.replace(/^www\./, "");
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  const pathname = request.nextUrl.pathname;
  const method = request.method;

  if (!hasSupabaseAuth()) {
    const res = NextResponse.next();
    if (!request.cookies.get("shynvo_dev_tid")?.value) {
      res.cookies.set("shynvo_dev_tid", globalThis.crypto.randomUUID(), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        httpOnly: true,
      });
    }
    if (method === "GET") noStoreHtml(res, pathname);
    return res;
  }

  const { response: sessionResponse, user } = await updateSupabaseSession(request);

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const redirect = NextResponse.redirect(url);
    if (method === "GET") noStoreHtml(redirect, pathname);
    return copyCookies(sessionResponse, redirect);
  }

  const authGate =
    pathname.startsWith("/auth/sign-in") || pathname.startsWith("/auth/sign-up");
  if (authGate && user) {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const url = request.nextUrl.clone();
    url.pathname = next;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    if (method === "GET") noStoreHtml(redirect, pathname);
    return copyCookies(sessionResponse, redirect);
  }

  if (method === "GET") noStoreHtml(sessionResponse, pathname);
  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
