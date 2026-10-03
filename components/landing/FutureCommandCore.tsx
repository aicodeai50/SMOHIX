'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StateBeacon } from '@/components/architecture';
import type { OperationalStatus, ProductStatusResult } from '@/lib/status/types';
export type CommandProduct = { id: string; name: string; href: string };
function availability(status?: OperationalStatus) {
  switch(status){
    case 'operational':return 'Endpoint reachable';
    case 'degraded':return 'Degraded';
    case 'unavailable':return 'Unreachable';
    case 'prototype':return 'Prototype';
    case 'planned':return 'Planned';
    default:return 'Not verified';
  }
}
export function FutureCommandCore({products}:{products:CommandProduct[]}) {
  const [statuses,setStatuses]=useState<ProductStatusResult[]>([]);
  const [pending,setPending]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const busy=useRef(false);
  const panel=useRef<HTMLDivElement>(null);
  const visible=useRef(false);
  const checkServices=useCallback(async()=>{
    if(busy.current)return;
    busy.current=true;setPending(true);setError(null);
    try{
      const response=await fetch('/api/status/products',{signal:AbortSignal.timeout(10_000),cache:'no-store'});
      if(!response.ok)throw new Error(response.status===429?'Checks are busy. Retrying on the next refresh.':'Service checks are temporarily unavailable.');
      const body=await response.json() as {products?:ProductStatusResult[]};
      if(!Array.isArray(body.products))throw new Error('Could not read service checks.');
      setStatuses(body.products);
    }catch(err){setError(err instanceof Error && err.name!=='TimeoutError'?err.message:'Service checks timed out. Retrying on the next refresh.');}
    finally{busy.current=false;setPending(false);}
  },[]);
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>{visible.current=entries[0]?.isIntersecting??false;if(visible.current && document.visibilityState==='visible')void checkServices();});
    if(panel.current)observer.observe(panel.current);
    const refresh=()=>{if(visible.current && document.visibilityState==='visible')void checkServices();};
    const timer=window.setInterval(refresh,60_000);
    document.addEventListener('visibilitychange',refresh);
    return ()=>{observer.disconnect();window.clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
  },[checkServices]);
  const results=products.map(product=>statuses.find(result=>result.productId===product.id));
  const reachable=results.filter(result=>result?.status==='operational').length;
  const attention=results.filter(result=>result?.status==='degraded'||result?.status==='unavailable').length;
  const verified=results.filter(result=>result&&['operational','degraded','unavailable'].includes(result.status)).length;
  return <div ref={panel} className="smohix-live-command relative mx-auto w-full min-w-0 max-w-xl lg:max-w-none">
    <p className="smohix-live-command__operational-label">Operational command</p>
    <div className="smohix-live-command__frame hq-command">
      <header className="hq-command__top"><div><p className="hq-command__eyebrow">Smohix ecosystem</p><p className="hq-command__title">Service command</p></div><StateBeacon label={pending?'Checking':error?'Check unavailable':statuses.length?'Public checks':'Awaiting checks'} tone="aware"/></header>
      <div className="hq-command__body">
        <dl className="hq-command__metrics" aria-label="Public service check results">{[['Services',String(products.length),'Monitored'],['Reachable',statuses.length?String(reachable):'—','Latest check'],['Attention',statuses.length?String(attention):'—','Latest check'],['Verified',statuses.length?String(verified):'—','Latest check']].map(([label,value,note])=><div key={label}><dt>{label}</dt><dd>{value}<span>{note}</span></dd></div>)}</dl>
        <div className="flex items-center justify-between gap-3"><p className="hq-command__eyebrow">Public service availability</p><button type="button" className="hq-command__check" disabled={pending} onClick={()=>void checkServices()}>{pending?'Checking…':'Refresh'}</button></div>
        <ul className="hq-command__services">{products.map((product,index)=><li key={product.id}><Link href={product.href}>{product.name}</Link><span data-status={results[index]?.status??'unknown'}>{availability(results[index]?.status)}</span></li>)}</ul>
        <p role="status" className="hq-command__status-note">{error??(pending?'Checking Smohix services…':statuses.length?`Last checked ${new Date(statuses[0].lastChecked).toLocaleTimeString()}.`:'Awaiting results.')}</p>
        <p className="hq-command__status-note">Updates every minute while visible. These checks verify endpoint reachability, not every product function or security posture.{error&&statuses.length?' Displayed results are from the previous successful check.':''}</p>
        <Link href="/status" className="mt-3 inline-block text-sm text-accent">Full service status →</Link>
      </div>
      <footer className="smohix-live-command__footer"><span>Connected services</span><span>Measured status</span><span>Workspace controls</span></footer>
    </div>
    <p className="smohix-live-command__preview-note"><Link href="/auth/sign-in?next=/hub" className="font-semibold text-accent">Open your live operational workspace →</Link></p>
  </div>;
}
