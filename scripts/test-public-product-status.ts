import assert from 'node:assert/strict';
import { healthPayloadStatus } from '../lib/status/probe';
import { PRODUCT_REGISTRY } from '../lib/product-registry';
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
