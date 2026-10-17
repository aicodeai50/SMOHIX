import {
  ALLOWLISTED_PUBLIC_HOSTS,
  getAllRegistryProducts,
  registryMaturityLabel,
  type ProductRegistryEntry,
  type RegistryMaturity,
} from "@/lib/product-registry";
import { getSiteUrl } from "@/lib/site";

import type { OperationalStatus, ProductStatusResult } from "./types";
import { healthPayloadStatus } from "./probe";

// Allow public health checks to finish during cold starts; the client deadline
// must remain longer than this parallel server probe window.
const PROBE_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 30_000;

let cache: { at: number; results: ProductStatusResult[] } | null = null;
let inFlight: Promise<ProductStatusResult[]> | null = null;

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
  return false;
}

function resolveProbeUrl(entry: ProductRegistryEntry): string | null {
  if (!entry.healthCheck) return null;
  const base =
    entry.healthCheck.host === "smohix.run"
      ? getSiteUrl().replace(/\/$/, "")
      : `https://${entry.healthCheck.host}`;
  try {
    const u = new URL(entry.healthCheck.path, base);
    if (!isAllowlistedHost(u.hostname) || u.origin !== new URL(base).origin) return null;
    if (u.protocol !== "https:" && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

async function probeUrl(url: string): Promise<OperationalStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const structured = ["/health", "/api/health", "/api/ping"].includes(new URL(url).pathname);
    const res = await fetch(url, {
      method: structured ? "GET" : "HEAD",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json, text/html" },
    });
    if (structured && (res.ok || res.status === 503)) {
      return healthPayloadStatus(await res.json());
    }
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

async function statusForProduct(entry: ProductRegistryEntry, probes: Map<string, Promise<OperationalStatus>>): Promise<ProductStatusResult> {
  const lastChecked = new Date().toISOString();
  const probe = resolveProbeUrl(entry);
  let status: OperationalStatus = maturityDefaultStatus(entry.maturity);

  if (probe && (entry.maturity === "live" || entry.maturity === "preview")) {
    if (!probes.has(probe)) probes.set(probe, probeUrl(probe));
    status = await probes.get(probe)!;
  } else if (entry.maturity === "prototype") {
    status = "prototype";
  } else if (entry.maturity === "planned") {
    status = "planned";
  }

  const detail =
    probe && entry.maturity === "live"
      ? `Service availability checked. ${registryMaturityLabel(entry.maturity)}. Individual features may have separate availability.`
      : `${registryMaturityLabel(entry.maturity)}. ${status === "unknown" ? "Availability has not been confirmed." : "See the product overview for availability and access."}`;

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
  if (inFlight) return inFlight;
  const probes = new Map<string, Promise<OperationalStatus>>();
  inFlight = Promise.all(getAllRegistryProducts().map((entry) => statusForProduct(entry, probes)))
    .then((results) => { cache = { at: Date.now(), results }; return results; })
    .finally(() => { inFlight = null; });
  return inFlight;
}

export async function fetchSiteHealthView(): Promise<{
  ok: boolean;
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
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export { statusLabel, statusToneClass } from "./presentation";
