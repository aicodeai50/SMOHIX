/** Distinguish a confirmed empty result from missing or failed data. */
export function confirmedMetricCount(result: { count: number | null; error: unknown }): number | null {
  return !result.error && result.count !== null && Number.isFinite(result.count) && result.count >= 0
    ? result.count : null;
}
