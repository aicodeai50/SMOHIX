/** Deployed services must never fall back to anonymous development access. */
export function proxyRequiresConfiguredAuth(env: Record<string, string | undefined>): boolean {
  return env.NODE_ENV?.trim().toLowerCase() === "production" ||
    Boolean(env.RAILWAY_ENVIRONMENT_ID?.trim() || env.RAILWAY_PROJECT_ID?.trim());
}

const PRIVATE_SEGMENTS = new Set(["admin", "internal", "debug", "databases", "docs", "redoc", "openapi.json", "metrics"]);

export function publicProxyPath(segments: string[] | undefined): string {
  if (!segments?.length) return "";
  for (const segment of segments) {
    // Next already decodes route parameters. Reject further encoding and URL syntax.
    if (!segment || segment.includes("..") || /[%/?#\\\u0000-\u0020\u007f]/.test(segment)) {
      throw new Error("invalid_path");
    }
    if (PRIVATE_SEGMENTS.has(segment.toLowerCase())) throw new Error("private_path");
  }
  return "/" + segments.join("/");
}
