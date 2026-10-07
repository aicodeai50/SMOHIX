import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { NextRequest } from 'next/server';
import { proxyToUpstream } from '../lib/upstream-proxy.ts';
const saved=Object.fromEntries(['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','REACT_APP_ROBOT_BACKEND'].map(k=>[k,process.env[k]]));
delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let status=500;
const server=createServer((req,res)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'public,max-age=3600','Retry-After':'15'});res.end(status===200?'{"ok":true}':'{"error":"postgres://private-password@internal-host"}');});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try {
 process.env.REACT_APP_ROBOT_BACKEND=`http://127.0.0.1:${server.address().port}`;
 for(const upstreamStatus of [500,400,429,302,200]){
  status=upstreamStatus;
  const response=await proxyToUpstream('robot',new NextRequest('http://localhost/api/robot/health'),['health']);
  const body=await response.text();
  assert.equal(response.status,upstreamStatus===500||upstreamStatus===302?502:upstreamStatus);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.doesNotMatch(body,/private-password|internal-host|postgres:/);
  if(upstreamStatus===200)assert.deepEqual(JSON.parse(body),{ok:true});
  if(upstreamStatus===429)assert.equal(response.headers.get('retry-after'),'15');
 }
 console.log('upstream privacy: real HTTP success/error/redirect/cache handling passed');
} finally {
 for(const [key,value] of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
