import {renderToStaticMarkup} from "react-dom/server";
import {StatusHistory} from "../components/status/StatusHistory";
import assert from 'node:assert/strict';
import {statusSamples} from './status-samples.mjs';
import {readFileSync} from 'node:fs';
import {CHECKOUT_ERRORS,checkoutErrorMessage,publicCheckoutFailure,parseCheckoutInput,safePayPalApprovalUrl,readCheckoutBody} from '../lib/billing/checkout-safety';
async function main(){
for(const value of [null,[],4,'x',{tier:4},{tier:'bad'},{tier:'top_up',topUpAmountCents:NaN},{tier:'top_up',topUpAmountCents:Infinity},{tier:'top_up',topUpAmountCents:499},{tier:'top_up',topUpAmountCents:500.5},{tier:'pro',userId:'forged'}])assert.equal(parseCheckoutInput(value),null);
assert.deepEqual(parseCheckoutInput({tier:'pro'}),{tier:'pro'});
assert.deepEqual(parseCheckoutInput({tier:'top_up',topUpAmountCents:500}),{tier:'top_up',topUpAmountCents:500});
for(const value of ['postgres://secret@private','PayPal API /v2/private 500 raw body','%broken',undefined]){assert.equal(checkoutErrorMessage(value),CHECKOUT_ERRORS.unavailable);assert.equal(publicCheckoutFailure(value),CHECKOUT_ERRORS.unavailable);}
assert.equal(checkoutErrorMessage('amount'),CHECKOUT_ERRORS.amount);
assert.equal(publicCheckoutFailure(CHECKOUT_ERRORS.plan),CHECKOUT_ERRORS.plan);
for(const url of ['https://www.paypal.com/checkoutnow?token=test','https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=test'])assert.equal(safePayPalApprovalUrl(url),true);
for(const url of ['http://www.paypal.com/','https://www.paypal.com.evil.example/','https://secret@www.paypal.com/','https://www.paypal.com:444/','javascript:alert(1)'])assert.equal(safePayPalApprovalUrl(url),false);
assert.deepEqual(await readCheckoutBody(new Request('https://smohix.run',{method:'POST',body:'{"tier":"pro"}'})),{tier:'pro'});
await assert.rejects(readCheckoutBody(new Request('https://smohix.run',{method:'POST',body:'x'.repeat(16001)})));
const settings=readFileSync(new URL('../app/(app)/settings/page.tsx',import.meta.url),'utf8');
assert.match(settings,/setupChecksVerified = !apiKeysError && !ingestError && !profileRow.error/);
assert.match(settings,/verifiedSetupDoneHint/);assert.doesNotMatch(settings,/ready for operations|live Supabase workspace state/);
const checkout=readFileSync(new URL('../app/api/billing/checkout/route.ts',import.meta.url),'utf8');assert.doesNotMatch(checkout,/encodeURIComponent\(result.error\)/);assert.match(checkout,/request.headers.get\("origin"\)/);
const products=['smohix-platform','smohix-ai','smohix-assistant','private-ai','smohix-own-api','identity'].map(productId=>({productId,status:'operational',lastChecked:new Date().toISOString(),secret:'private backend'}));
const rows=statusSamples(products);assert.equal(rows.length,6);assert.doesNotMatch(JSON.stringify(rows),/private backend|secret/);assert.deepEqual(Object.keys(rows[0]).sort(),['checked_at','product_id','status']);assert.throws(()=>statusSamples(products.slice(1)));assert.throws(()=>statusSamples(products.map(item=>({...item,lastChecked:'2000-01-01T00:00:00Z'}))));
const previousUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,previousKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
try{delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.SUPABASE_SERVICE_ROLE_KEY;assert.match(renderToStaticMarkup(await StatusHistory()),/Recorded history is not available yet/);process.env.NEXT_PUBLIC_SUPABASE_URL='invalid-private-host';process.env.SUPABASE_SERVICE_ROLE_KEY='private-key-test';const html=renderToStaticMarkup(await StatusHistory());assert.match(html,/Recorded history is not available yet/);assert.doesNotMatch(html,/invalid-private-host|private-key-test/);}finally{if(previousUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=previousUrl;if(previousKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=previousKey;}
const billingPage=readFileSync(new URL('../app/(app)/settings/billing/page.tsx',import.meta.url),'utf8');assert.doesNotMatch(billingPage,/PAYPAL_CLIENT_SECRET|PAYPAL_CLIENT_ID|Set Supabase environment|\{queryError.message\}|\{balanceError\}|\{txError\}/);assert.match(billingPage,/Could not verify plan/);assert.match(billingPage,/balanceError \? "Unavailable"/);
console.log('enterprise-hardening: checkout input, error privacy, redirect safety, body limits and setup evidence passed');

}
void main().catch(error=>{console.error(error);process.exitCode=1;});
