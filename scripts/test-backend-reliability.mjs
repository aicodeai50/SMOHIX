import assert from 'node:assert/strict';
import { dataUnavailable } from '../lib/data-unavailable.ts';
import { executeRobotAction } from '../lib/automations/connector-execution.ts';
import { approvalMatchesExecution } from '../lib/automations/execution-approval.ts';
import { deliverAuditRecord } from '../lib/audit/delivery.ts';
import { upsertDefaultSloForService } from '../lib/services/slo.ts';
import { listAcceptedPolicyGuardrailsForPlaybook } from '../lib/approvals/policy-suggestions.ts';
import { proxyRequiresConfiguredAuth, publicProxyPath } from '../lib/proxy-policy.ts';
import { getConnectorHealthRows } from '../lib/connectors-health.ts';

const originalFetch = globalThis.fetch;
const connectorEnv = { ...process.env };
try {
  process.env.REACT_APP_SH_BACKEND_API = 'http://private-reasoning.railway.internal';
  process.env.REACT_APP_ROBOT_BACKEND = 'http://private-robot.railway.internal';
  globalThis.fetch = async () => Response.json({ password: 'private-diagnostic', database: 'private-database' });
  const rows = await getConnectorHealthRows();
  assert.ok(rows.every(row => row.configured && row.ok));
  assert.doesNotMatch(JSON.stringify(rows), /railway|private-|password|database|baseUrl/);
  globalThis.fetch = async () => { throw new Error('private-diagnostic'); };
  const failedRows = await getConnectorHealthRows();
  assert.ok(failedRows.every(row => row.ok === false));
  assert.doesNotMatch(JSON.stringify(failedRows), /railway|private-|password|database|baseUrl/);
} finally {
  globalThis.fetch = originalFetch;
  process.env = connectorEnv;
}

assert.equal(proxyRequiresConfiguredAuth({ NODE_ENV: 'production' }), true);
assert.equal(proxyRequiresConfiguredAuth({ NODE_ENV: 'development', RAILWAY_ENVIRONMENT_ID: 'deployed' }), true);
assert.equal(proxyRequiresConfiguredAuth({ NODE_ENV: 'development' }), false);
assert.equal(publicProxyPath(['api', 'v1', 'robot', 'command']), '/api/v1/robot/command');
assert.equal(publicProxyPath(['health']), '/health');
for (const segments of [['admin'], ['api','v1','databases','status'], ['INTERNAL'], ['docs'], ['%2e%2e'], ['path?admin=true'], ['path#admin'], ['..'], ['a/b'], ['a\\b']]) {
  assert.throws(() => publicProxyPath(segments));
}

const capturedLogs = [];
const originalConsoleError = console.error;
let unavailableError;
try {
  console.error = line => capturedLogs.push(line);
  try { dataUnavailable('organization membership', { code: 'PGRST205', message: 'private table diagnostic' }); }
  catch (error) { unavailableError = error; }
  assert.ok(unavailableError instanceof Error);
  assert.throws(() => dataUnavailable('organization membership', unavailableError), error => error === unavailableError);
} finally { console.error = originalConsoleError; }
assert.equal(capturedLogs.length, 1, 'Rethrowing a workspace failure must preserve its original diagnostic');
assert.equal(JSON.parse(capturedLogs[0]).code, 'PGRST205');
assert.doesNotMatch(unavailableError.message, /PGRST205|private table/);
assert.doesNotMatch(capturedLogs[0], /private table/);

const input = { playbookId: 'pb-test', rollbackPlan: 'Restore prior version', approvalNote: 'Reviewed' };
let calls = 0;
const confirmed = await executeRobotAction('https://robot.invalid/', input, 'request-1', async (url, options) => {
  calls++;
  assert.equal(url, 'https://robot.invalid/v1/remediate');
  assert.equal(options.method, 'POST');
  assert.equal(options.redirect, 'error');
  assert.equal(options.headers['Idempotency-Key'], 'request-1');
  assert.equal(JSON.parse(options.body).request_id, 'request-1');
  assert.ok(options.signal instanceof AbortSignal);
  return Response.json({ ok: true, steps: [{ status: 'succeeded' }] });
});
assert.equal(confirmed.ok, true);
assert.equal(calls, 1);
for (const [body, status] of [[{}, 200], [null, 200], [{ok:false}, 200], [{ok:true}, 200], [{ok:true,steps:[]}, 200], [{ok:true}, 202], [{ok:true}, 500], [{ok:true,steps:[{status:'failed'}]},200], [{ok:true,steps:[{status:'running'}]},200], [{ok:true,steps:[null]},200], [{ok:true,steps:{}},200]]) {
  let attempts = 0;
  const result = await executeRobotAction('https://robot.invalid', input, 'request-2', async () => {
    attempts++;
    return Response.json(body, { status });
  });
  assert.equal(result.ok, false);
  assert.equal(attempts, 1, 'Infrastructure actions must never retry automatically');
}
const lost = await executeRobotAction('https://robot.invalid', input, 'request-3', async () => { throw new Error('secret backend diagnostic'); });
assert.equal(lost.ok, false);
assert.equal(lost.uncertain, true);
assert.doesNotMatch(lost.message, /secret|robot.invalid/);

const now = Date.now();
const playbook = { id:'pb-test', name:'Restart workers' };
const approval = { status:'approved', action_label:playbook.id, decided_by:'reviewer', requester_id:'operator', updated_at:new Date(now-1000).toISOString() };
assert.equal(approvalMatchesExecution(approval,playbook,now),true);
for (const changes of [{status:'pending'}, {action_label:'Another action'}, {decided_by:'operator'}, {decided_by:null}, {updated_at:new Date(now-7200001).toISOString()}, {updated_at:new Date(now+1000).toISOString()}]) {
  assert.equal(approvalMatchesExecution({...approval,...changes},playbook,now),false);
}
let writes = 0;
assert.equal((await deliverAuditRecord(async () => ({error: ++writes < 3 ? {code:'08006'} : null}))).ok,true);
assert.equal(writes,3);
writes=0;
assert.equal((await deliverAuditRecord(async () => { writes++; return {error:{code:'42501'}}; })).ok,false);
assert.equal(writes,1);
writes=0;
assert.equal((await deliverAuditRecord(async () => { writes++; throw new Error('lost response'); })).ok,false);
assert.equal(writes,3);
assert.equal((await deliverAuditRecord(async () => ({error:{code:'23505'}}))).ok,true);
let savedTarget = 99.95;
await upsertDefaultSloForService({ from(table) {
  assert.equal(table, 'service_slos');
  return { async upsert(row, options) {
    if (!options.ignoreDuplicates) savedTarget = row.target_percent;
    return { error: null };
  } };
} }, 'user-1', 'service-1');
assert.equal(savedTarget,99.95,'Opening a service must preserve its configured SLO target');
const storedPolicy = { id:'policy-1', playbook_id:'pb-test', suggestion_key:'pb-test-service-auto-approve', guardrails_json:['Require successful dry-run within 2h','Enforce change window'], reviewer_notes:null };
let selectedFields=[];
const policyQuery = { is() { return this; }, or() { return this; }, select(fields) { selectedFields=fields.split(',').map(field=>field.trim()); return this; }, eq() { return this; }, limit() { return this; }, then(resolve) {
  return Promise.resolve({ error:null, data:[Object.fromEntries(Object.entries(storedPolicy).filter(([field])=>selectedFields.includes(field)))] }).then(resolve);
} };
const guardrails = await listAcceptedPolicyGuardrailsForPlaybook({from() { return policyQuery; }},'user-1','pb-test');
assert.equal(guardrails?.requireDryRunFresh,true,'Accepted policies must reach execution enforcement');
assert.equal(guardrails?.requireChangeWindow,true);
console.log('Backend reliability checks passed: execution confirmation, safe uncertainty, two-person approval and bounded audit delivery.');
