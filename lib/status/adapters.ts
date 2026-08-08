import {
  ALLOWLISTED_PUBLIC_HOSTS,
  getAllRegistryProducts,
  registryMaturityLabel,
  type ProductRegistryEntry,
  type RegistryMaturity,
} from "@/lib/product-registry";
import { getSiteUrl } from "@/lib/site";

import type { OperationalStatus, ProductStatusResult } from "./types";

const PROBE_TIMEOUT_MS = 5_000;
const CACHE_TTL_MS = 60_000;

let cache: { at: number; results: ProductStatusResult[] } | null = null;

function maturityDefaultStatus(m: RegistryMaturity): OperationalStatus {
  switch (m) {
    case "live":
      return "unknown";
    case "preview":
    case "prototype":
      return "prototype";
    case "internal":
      return "unknown";
    case "planned":
      return "planned";
  }
}

function isAllowlistedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (ALLOWLISTED_PUBLIC_HOSTS.includes(h as (typeof ALLOWLISTED_PUBLIC_HOSTS)[number])) {
    return true;
  }
  return h === "ai.smohix.run" || h.endsWith(".smohix.run");
}

function resolveProbeUrl(entry: ProductRegistryEntry): string | null {
  if (!entry.healthCheck) return null;
  const base =
    entry.healthCheck.host === "ai.smohix.run"
      ? "https://ai.smohix.run"
      : getSiteUrl().replace(/\/$/, "");
  try {
    const u = new URL(entry.healthCheck.path, base);
    if (!isAllowlistedHost(u.hostname)) return null;
    if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

async function probeUrl(url: string): Promise<"operational" | "unavailable"> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json, text/html" },
    });
    if (res.ok || (res.status >= 300 && res.status < 400)) {
      return "operational";
    }
    return "unavailable";
  } catch {
    return "unavailable";
  } finally {
    clearTimeout(timer);
  }
}

async function statusForProduct(entry: ProductRegistryEntry): Promise<ProductStatusResult> {
  const lastChecked = new Date().toISOString();
  const probe = resolveProbeUrl(entry);
  let status: OperationalStatus = maturityDefaultStatus(entry.maturity);

  if (probe && (entry.maturity === "live" || entry.maturity === "preview")) {
    const probeResult = await probeUrl(probe);
    status = probeResult === "operational" ? "operational" : "unavailable";
  } else if (entry.maturity === "prototype") {
    status = "prototype";
  } else if (entry.maturity === "planned") {
    status = "planned";
  }

  const detail =
    probe && entry.maturity === "live"
      ? `Last probe: ${entry.healthCheck?.path ?? "—"} (${registryMaturityLabel(entry.maturity)}).`
      : `${registryMaturityLabel(entry.maturity)} — ${entry.limitations[0] ?? entry.description}`;

  return {
    productId: entry.id,
    label: entry.publicName,
    status,
    detail,
    lastChecked,
    href: entry.productPagePath,
  };
}

/** Server-side product status — cached briefly, no secrets, allowlisted hosts only. */
export async function fetchProductStatuses(): Promise<ProductStatusResult[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.results;
  }
  const entries = getAllRegistryProducts();
  const results = await Promise.all(entries.map(statusForProduct));
  cache = { at: Date.now(), results };
  return results;
}

export async function fetchSiteHealthView(): Promise<{
  ok: boolean;
  service: string;
  uptime_s: number | null;
} | null> {
  const base = getSiteUrl().replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/api/health`, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return {
      ok: data.ok === true,
      service: typeof data.service === "string" ? data.service : "smohix-web",
      uptime_s:
        typeof data.uptime_s === "number" && Number.isFinite(data.uptime_s)
          ? Math.max(0, Math.round(data.uptime_s))
          : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function statusLabel(s: OperationalStatus): string {
  switch (s) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "unavailable":
      return "Unavailable";
    case "unknown":
      return "Unknown";
    case "prototype":
      return "Prototype";
    case "planned":
      return "Planned";
  }
}

export function statusToneClass(s: OperationalStatus): string {
  switch (s) {
    case "operational":
      return "border-accent/30 bg-accent-dim text-accent";
    case "degraded":
      return "border-warning/30 bg-warning-dim text-warning";
    case "unavailable":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "prototype":
      return "border-warning/30 bg-warning-dim text-warning";
    case "planned":
    case "unknown":
      return "border-white/[0.12] bg-white/[0.03] text-muted";
  }
}
