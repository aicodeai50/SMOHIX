import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { publicActionError } from '../lib/security/public-action-error.ts';
import { publicAuthError } from '../lib/auth/public-error.ts';
import { resolveRecoverySession } from '../lib/auth/recovery-session.ts';
import { requiresConfiguredProductionAuth } from '../lib/auth/production-access.ts';
import { validNotificationPreferences } from '../lib/notifications/preferences-input.ts';

assert.equal(await resolveRecoverySession(async()=>true),true);
assert.equal(await resolveRecoverySession(async()=>false),false);
assert.equal(await resolveRecoverySession(async()=>{throw new Error('private provider diagnostic');}),false);
assert.equal(await resolveRecoverySession(()=>new Promise(()=>{}),15),false,'stalled reset check terminates');
assert.match(publicAuthError({code:'invalid_credentials',message:'private host'}),/email or password/);
assert.doesNotMatch(publicAuthError({message:'SUPABASE_SERVICE_ROLE_KEY secret railway.internal'}),/SUPABASE|secret|railway/);
for(const url of ['/hub','/resilience/backups','/settings','/api/robot/run','/api/copilot/chat','/api/user/api-keys']) {
 assert.equal(requiresConfiguredProductionAuth(url,'production'),true,url);
 assert.equal(requiresConfiguredProductionAuth(url,'development'),false,url);
}
for(const url of ['/','/platform','/docs/sdk','/auth/sign-in','/api/health','/api/health/db','/api/contact','/api/status/products']) assert.equal(requiresConfiguredProductionAuth(url,'production'),false,url);
assert.equal(requiresConfiguredProductionAuth('/api/health/private','production'),true,'public exceptions are exact paths');
for(const body of [null,[],false,'true',{incidents:'false'},{admin:true},{incidents:{enabled:true}}]) assert.equal(validNotificationPreferences(body),false);
assert.equal(validNotificationPreferences({incidents:false,approvals:true,billing:true,compliance:false}),true);
const db=readFileSync(new URL('../app/api/health/db/route.ts',import.meta.url),'utf8');
assert.doesNotMatch(db,/postgres_version|error:\s*error.message/,'public DB readiness never returns versions or diagnostics');
console.log('surface-hardening: reset completion, safe errors, production auth fallback and preferences validation passed');

assert.equal(publicActionError("forbidden"),"forbidden");
assert.equal(publicActionError("password=private; postgres://internal"),"request_failed");
for(const entry of readdirSync(new URL("../app/(app)/",import.meta.url),{withFileTypes:true})){if(entry.isDirectory())assert.equal(requiresConfiguredProductionAuth("/"+entry.name,"production"),true,"console route "+entry.name);}
