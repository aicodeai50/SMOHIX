import { isProtectedPath } from "./paths";

const PUBLIC_APIS = new Set(["/api/health", "/api/health/db", "/api/status/products", "/api/contact"]);
/** A missing identity deployment must never turn production into an anonymous development tenant. */
export function requiresConfiguredProductionAuth(pathname: string, environment: string | undefined): boolean {
  return environment === "production" && (isProtectedPath(pathname) ||
    (pathname.startsWith("/api/") && !PUBLIC_APIS.has(pathname)));
}
