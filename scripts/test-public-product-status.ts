import assert from 'node:assert/strict';
import { healthPayloadStatus } from '../lib/status/probe';
import { PRODUCT_REGISTRY } from '../lib/product-registry';
import { getCommandSnapshot, commandAvailability } from '../lib/hq/command-status';
import type { ProductStatusResult } from '../lib/status/types';

const checked = Date.parse('2026-10-06T12:00:00Z');
const monitored: ProductStatusResult[] = ['operational', 'degraded', 'unavailable', 'unknown'].map((status, index) => ({
  productId: String(index), label: String(index), status: status as ProductStatusResult['status'],
  detail: '', lastChecked: new Date(checked).toISOString(), href: '/status',
}));
const commandOptions = { now: checked, receivedAt: checked, error: false, paused: false };
const command = getCommandSnapshot(['0', '1', '2', '3'], monitored, commandOptions);
assert.equal(command.feed, 'live', 'a live feed can report unhealthy endpoints without claiming they are healthy');
assert.equal(command.reachable, 1);
assert.equal(command.attention, 2);
assert.equal(command.verified, 3, 'unknown endpoints must not count as verified');
assert.equal(getCommandSnapshot(['0'], monitored, { ...commandOptions, now: checked + 90_001 }).feed, 'stale');
assert.equal(getCommandSnapshot(['0'], monitored, { ...commandOptions, receivedAt: checked + 100_000, now: checked + 100_000 }).feed, 'stale', 'receiving old cached results must not make them fresh');
assert.equal(getCommandSnapshot(['0'], monitored, { ...commandOptions, error: true }).feed, 'stale');
assert.equal(getCommandSnapshot(['0'], monitored, { ...commandOptions, paused: true }).feed, 'paused');
assert.equal(getCommandSnapshot(['missing'], monitored, commandOptions).feed, 'stale');
assert.equal(getCommandSnapshot(['0'], [], { ...commandOptions, receivedAt: null }).feed, 'connecting');
assert.equal(getCommandSnapshot(['0'], [], { ...commandOptions, receivedAt: null, error: true }).feed, 'stale');
assert.equal(commandAvailability('unavailable'), 'Unreachable');
assert.equal(healthPayloadStatus({ok:true}), 'operational');
assert.equal(healthPayloadStatus({ok:true,status:'degraded'}), 'degraded');
assert.equal(healthPayloadStatus({ok:false}), 'degraded');
assert.equal(healthPayloadStatus(null), 'unknown');
assert.equal(healthPayloadStatus({message:'hello'}), 'unknown');
assert.equal(healthPayloadStatus({status:'operational'}), 'operational');
assert.equal(healthPayloadStatus({status:'outage'}), 'unavailable');
assert.equal(healthPayloadStatus({ok:true,status:'unavailable'}), 'unavailable');
async function main() {
const calls: string[] = [];
const original = globalThis.fetch;
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input); calls.push(url);
  assert.equal(init?.redirect, 'manual');
  if(url.includes('ai.smohix.run')) return Response.json({ok:false,status:'degraded'}, {status:503});
  if(url.includes('assistant.smohix.run')) return Response.json({ok:false,status:'unavailable'}, {status:503});
  if(url.includes('pri.smohix.run')) return Response.json({status:'operational'});
  if(url.endsWith('/api/health')) return Response.json({ok:true});
  return new Response(null, {status:200});
}) as typeof fetch;
try {
  const { fetchProductStatuses } = await import('../lib/status/adapters');
  const [first, second] = await Promise.all([fetchProductStatuses(), fetchProductStatuses()]);
  assert.deepEqual(first, second);
  assert.equal(calls.length, 4, 'same endpoints and concurrent callers should share probes');
  assert.equal(first.find((item) => item.productId === 'smohix-ai')?.status, 'degraded');
  assert.equal(first.find((item) => item.productId === 'smohix-assistant')?.status,'unavailable');
  assert.equal(first.find((item) => item.productId === 'private-ai')?.status,'operational');
  assert.equal(first.find((item) => item.productId === 'projects')?.status,'planned');
  assert.equal(first.find((item) => item.productId === 'identity')?.status,'unknown');
  await fetchProductStatuses(); assert.equal(calls.length,4,'cached check should not poll');
  assert.equal(first.length, PRODUCT_REGISTRY.length);
  for (const item of first) assert.deepEqual(Object.keys(item).sort(), ['detail','href','label','lastChecked','productId','status'].sort());
} finally { globalThis.fetch=original; }
console.log('test-public-product-status: all checks passed');
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
