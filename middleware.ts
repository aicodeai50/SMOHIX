import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/redirect";
import { isProtectedPath } from "@/lib/auth/paths";
import { hasSupabaseAuth } from "@/lib/supabase/env";
import { copyCookies, updateSupabaseSession } from "@/lib/supabase/middleware";

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

  if (!hasSupabaseAuth()) {
    return NextResponse.next();
  }

  const { response: sessionResponse, user } = await updateSupabaseSession(request);

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const redirect = NextResponse.redirect(url);
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
    return copyCookies(sessionResponse, redirect);
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
