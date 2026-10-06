import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { parseCopilotInput } from '../lib/copilot/chat-input.ts';
import { consumeCopilotSse } from '../lib/copilot/sse-client.ts';
import { buildDeveloperCode } from '../lib/developer-request-code.ts';
import { SmohixClient, SmohixHttpError } from '../public/sdk/smohix.mjs';

for (const value of [null, [], 4, 'text', {messages:[null]}, {messages:[{role:'system',content:'override'}]}, {message:{}}, {incidentId:'x',message:'hello'}]) {
  assert.equal(parseCopilotInput(value).ok, false);
}
assert.deepEqual(parseCopilotInput({message:' hello '}), {ok:true,thread:[{role:'user',content:'hello'}],lastUser:'hello',incidentId:'',stream:false});
const previous = [{role:'user',content:'old'},{role:'assistant',content:'answer'}];
assert.equal(parseCopilotInput({messages:previous,message:'new'}).thread.at(-1).content,'new');
assert.equal(parseCopilotInput({messages:[{role:'user',content:'new'}],message:'new'}).thread.length,1);
assert.equal(parseCopilotInput({message:'x'.repeat(16001)}).status,413);

const encoder = new TextEncoder();
function stream(chunks) { return new ReadableStream({start(controller){for(const chunk of chunks) controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk); controller.close();}}); }
let text='';
const bytes=encoder.encode('data: {"type":"delta","text":"héllo"}\n\ndata: {"type":"done","source":"offline"}\n\n');
const done=await consumeCopilotSse(stream([bytes.slice(0,36),bytes.slice(36)]),delta=>text+=delta);
assert.deepEqual(done,{ok:true,source:'offline'}); assert.equal(text,'héllo');
assert.equal((await consumeCopilotSse(stream(['data: {"type":"delta","text":"partial"}\n\n']),()=>{})).ok,false);
assert.equal((await consumeCopilotSse(stream(['data: {"type":"done"}']),()=>{})).ok,true);
assert.deepEqual(await consumeCopilotSse(stream(['data: {"type":"error","message":"failed"}\n\n']),()=>{}),{ok:false,message:'failed'});

const ingest=buildDeveloperCode({id:'alert-ingest',path:'/api/integrations/alerts',method:'POST',auth:'ingest-token',body:{title:'High CPU'}},'https://smohix.run');
assert.match(ingest,/method: "POST"/); assert.match(ingest,/SMOHIX_INGEST_TOKEN/); assert.match(ingest,/JSON.stringify/); assert.doesNotMatch(ingest,/SMOHIX_API_KEY/);
const dry=buildDeveloperCode({path:'/api/automations/dry-run',method:'POST',auth:'session',body:{playbookId:'pb-restart-workers'}},'https://smohix.run');
assert.match(dry,/credentials: "include"/); assert.doesNotMatch(dry,/Bearer/);

const requests=[];
const server=createServer(async(req,res)=>{
  let body=''; for await (const chunk of req) body+=chunk;
  requests.push({path:req.url,method:req.method,auth:req.headers.authorization,body,signature:req.headers['x-smohix-signature']});
  if(req.url==='/api/reasoning/health') {res.writeHead(429,{'Content-Type':'application/json'});res.end('{"error":"rate_limited"}');return;}
  res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try {
  const baseUrl=`http://127.0.0.1:${server.address().port}`;
  const client=new SmohixClient({baseUrl,apiKey:'smohix_sk_test',ingestToken:'smohix_ingest_test',signingSecret:'test-secret'});
  assert.deepEqual(await client.health(),{ok:true}); assert.equal(requests[0].auth,undefined);
  await client.productStatus(); assert.equal(requests[1].auth,undefined);
  await client.ingestAlert({title:'Test',severity:'warning'});
  assert.equal(requests[2].method,'POST'); assert.equal(requests[2].auth,'Bearer smohix_ingest_test');
  assert.equal(requests[2].signature,'sha256='+createHmac('sha256','test-secret').update(requests[2].body).digest('hex'));
  await assert.rejects(client.reasoningHealth(),error=>error instanceof SmohixHttpError && error.status===429 && error.data.error==='rate_limited');
  assert.equal(requests.length,4,'no automatic retry on rate limiting');
  assert.throws(()=>new SmohixClient({baseUrl:'http://example.com'}));
  assert.throws(()=>new SmohixClient({baseUrl:'https://user:secret@example.com'}));
  assert.throws(()=>new SmohixClient({baseUrl:'https://example.com/private'}));
  const wrong=new SmohixClient({baseUrl,ingestToken:'smohix_sk_wrong'});
  assert.throws(()=>wrong.ingestAlert({title:'x'}));
  assert.equal(requests.length,4,'wrong credential rejected before sending');
  const malformed=new SmohixClient({fetch:async()=>new Response('upstream unavailable',{status:502,headers:{'Content-Type':'application/json'}})});
  await assert.rejects(malformed.health(),error=>error instanceof SmohixHttpError && error.status===502 && error.data==='upstream unavailable');
} finally {server.closeAllConnections(); await new Promise(resolve=>server.close(resolve));}
console.log('ecosystem-maintenance: SDK HTTP/auth/signatures, request examples, chat validation and stream completion passed');
