import type { OperationalStatus } from './types';
/** Explicit failure takes precedence over a contradictory ok flag. Unknown states stay unverified. */
export function healthPayloadStatus(payload: unknown): OperationalStatus {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'unknown';
  const data = payload as Record<string, unknown>;
  const status = typeof data.status === 'string' ? data.status.trim().toLowerCase() : null;
  if (status && ['outage', 'unavailable', 'error', 'failed', 'down'].includes(status)) return 'unavailable';
  if (status === 'degraded' || status === 'unhealthy' || data.ok === false) return 'degraded';
  if (status && ['ok', 'healthy', 'operational', 'ready'].includes(status)) return 'operational';
  if (data.status === undefined && data.ok === true) return 'operational';
  return 'unknown';
}
