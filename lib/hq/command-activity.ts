import type { ProductStatusResult, OperationalStatus } from "../status/types";

export type CommandChange = { id: string; productId: string; from: OperationalStatus; to: OperationalStatus; at: number };
/** Keep the latest baseline if a cache returns an older check. */
export function newestCommandResults(previous: ProductStatusResult[], next: ProductStatusResult[]): ProductStatusResult[] {
  return next.map(result => {
    const before = previous.find(item => item.productId === result.productId);
    return before && Date.parse(before.lastChecked) > Date.parse(result.lastChecked) ? before : result;
  });
}
/** Only newer checks can produce changes. The first snapshot establishes a baseline. */
export function commandChanges(previous: ProductStatusResult[], next: ProductStatusResult[]): CommandChange[] {
  return next.flatMap(result => {
    const before = previous.find(item => item.productId === result.productId);
    const at = Date.parse(result.lastChecked);
    if (!before || before.status === result.status || !Number.isFinite(at) || at <= Date.parse(before.lastChecked)) return [];
    return [{ id: `${result.productId}:${at}:${result.status}`, productId: result.productId, from: before.status, to: result.status, at }];
  });
}
