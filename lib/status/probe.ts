import type { OperationalStatus } from './types';
/** A reachable health endpoint can still report degraded functionality. */
export function healthPayloadStatus(payload: unknown): OperationalStatus {
  if (!payload || typeof payload !== 'object') return 'unknown';
  const data = payload as Record<string, unknown>;
  if (data.status === 'degraded' || data.ok === false) return 'degraded';
  if (data.ok === true || data.status === 'ok' || data.status === 'healthy') return 'operational';
  return 'unknown';
}
