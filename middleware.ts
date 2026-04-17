import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirects www → apex for the primary host (e.g. www.shynvo.app → shynvo.app).
 * Skips localhost and typical preview hosts.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!host.startsWith("www.")) {
    return NextResponse.next();
  }
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.hostname = host.replace(/^www\./, "");
  url.protocol = "https:";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
