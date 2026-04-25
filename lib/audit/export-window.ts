/** Maps audit export / UI `window` query to `created_at` lower bound (UTC). */
export function auditWindowToSinceIso(
  windowRaw: string | null | undefined,
): "all" | "24h" | "7d" | "30d" {
  const w = (windowRaw ?? "").trim().toLowerCase();
  if (w === "24h" || w === "7d" || w === "30d" || w === "all") return w;
  return "all";
}

export function auditSinceIsoFromWindow(windowNorm: "all" | "24h" | "7d" | "30d"): string | null {
  if (windowNorm === "all") return null;
  if (windowNorm === "24h") return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  if (windowNorm === "7d") return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}
