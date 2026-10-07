import type { OperationalStatus, ProductStatusResult } from "@/lib/status/types";

export function commandAvailability(status?: OperationalStatus) {
  switch (status) {
    case "operational": return "Available";
    case "degraded": return "Degraded";
    case "unavailable": return "Unavailable";
    case "prototype": return "Prototype";
    case "planned": return "Planned";
    default: return "Checking";
  }
}

export function getCommandSnapshot(ids: string[], statuses: ProductStatusResult[], options: {
  now: number; receivedAt: number | null; error: boolean; paused: boolean;
}) {
  const results = ids.map(id => statuses.find(result => result.productId === id));
  const checkedTimes = results.flatMap(result => {
    const time = result ? Date.parse(result.lastChecked) : NaN;
    return Number.isFinite(time) ? [time] : [];
  });
  const checkedAt = checkedTimes.length ? Math.min(...checkedTimes) : null;
  const stale = options.receivedAt !== null && (options.error || checkedAt === null ||
    options.now - Math.min(options.receivedAt, checkedAt) > 90_000);
  const feed = options.paused ? "paused" : options.error || stale ? "stale" : options.receivedAt !== null ? "live" : "connecting";
  return {
    results, checkedAt, feed,
    reachable: results.filter(result => result?.status === "operational").length,
    attention: results.filter(result => result?.status === "degraded" || result?.status === "unavailable").length,
    verified: results.filter(result => result && ["operational", "degraded", "unavailable"].includes(result.status)).length,
  };
}
