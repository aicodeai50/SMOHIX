import type { OperationalStatus } from './types';
/** A reachable health endpoint can still report degraded functionality. */
export function healthPayloadStatus(payload: unknown): OperationalStatus {
  if (!payload || typeof payload !== 'object') return 'unknown';
  const data = payload as Record<string, unknown>;
  if (data.status === 'outage' || data.status === 'unavailable') return 'unavailable';
  if (data.status === 'degraded' || data.ok === false) return 'degraded';
  if (data.ok === true || ['ok', 'healthy', 'operational', 'ready'].includes(String(data.status))) return 'operational';
  return 'unknown';
}
