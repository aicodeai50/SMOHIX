"use client";
import Link from 'next/link';
import { useRef, useState } from 'react';
import { StateBeacon } from '@/components/architecture';
import { CommandSimulation } from './CommandSimulation';
import type { OperationalStatus, ProductStatusResult } from '@/lib/status/types';
export type CommandProduct = { id: string; name: string; href: string };
const STEPS = [
  { label: 'Signals', title: 'Understand the incident', detail: 'Correlate the alert, affected service, and accountable owner before deciding what to change.', metric: '01', next: 'Review the proposed action', href: '/auth/sign-in?next=/incidents' },
  { label: 'Approvals', title: 'Keep authority with people', detail: 'A dry-run prepares the action. A delegated operator reviews the risk and authorizes execution.', metric: '02', next: 'Inspect the evidence trail', href: '/auth/sign-in?next=/approvals' },
  { label: 'Evidence', title: 'Make every decision reviewable', detail: 'Follow the incident timeline, approval record, and execution outcome in the audit workspace.', metric: '03', next: 'Back to signal intake', href: '/auth/sign-in?next=/audit' },
] as const;
function availability(status?: OperationalStatus) {
  switch (status) {
    case 'operational': return 'Endpoint reachable';
    case 'degraded': return 'Degraded';
    case 'unavailable': return 'Unreachable';
    case 'prototype': return 'Prototype';
    case 'planned': return 'Planned';
    case 'unknown': return 'Not verified';
    default: return 'Not checked';
  }
}
export function FutureCommandCore({ products }: { products: CommandProduct[] }) {
  const [view, setView] = useState<'workflow' | 'services' | 'activity'>('workflow');
  const [step, setStep] = useState(0);
  const [statuses, setStatuses] = useState<ProductStatusResult[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const current = STEPS[step];
  async function checkServices() {
    if (busy.current) return;
    busy.current = true; setPending(true); setError(null);
    try {
      const response = await fetch('/api/status/products', { signal: AbortSignal.timeout(10_000), cache: 'no-store' });
      if (!response.ok) throw new Error(response.status === 429 ? 'Please wait a minute before checking again.' : 'Service checks are temporarily unavailable.');
      const body = await response.json() as { products?: ProductStatusResult[] };
      if (!Array.isArray(body.products)) throw new Error('Could not read service checks.');
      setStatuses(body.products);
    } catch (err) { setError(err instanceof Error && err.name !== 'TimeoutError' ? err.message : 'Service checks timed out. Please try again.'); }
    finally { busy.current = false; setPending(false); }
  }
  return <div className="smohix-live-command relative mx-auto w-full min-w-0 max-w-xl lg:max-w-none">
    <p className="smohix-live-command__operational-label">Operational command</p>
    <div className="smohix-live-command__frame hq-command">
      <header className="hq-command__top">
        <div><p className="hq-command__eyebrow">Smohix Platform</p><p className="hq-command__title">One command environment.</p></div>
        <StateBeacon label={view === 'workflow' ? 'Workflow preview' : view === 'activity' ? 'Simulation' : 'Public checks'} tone="aware" />
      </header>
      <div className="hq-command__views" aria-label="Command views">
        <button type="button" aria-pressed={view === 'workflow'} onClick={() => setView('workflow')}>Workflow</button>
        <button type="button" aria-pressed={view === 'services'} onClick={() => setView('services')}>Service availability</button>
        <button type="button" aria-pressed={view === 'activity'} onClick={() => setView('activity')}>Activity demo</button>
      </div>
      {view === 'activity' ? <CommandSimulation /> : view === 'workflow' ? <div className="hq-command__body">
        <p className="hq-command__eyebrow">Illustrative incident-to-evidence flow</p>
        <ol className="hq-command__steps">{STEPS.map((item, index) => <li key={item.label}>
          <button type="button" aria-current={step === index ? 'step' : undefined} onClick={() => setStep(index)}><span>{item.metric}</span>{item.label}</button>
        </li>)}</ol>
        <div className="hq-command__signal" aria-live="polite" aria-atomic="true">
          <p className="hq-command__step-number">{current.metric} <span>/ 03</span></p>
          <h2 className="hq-command__signal-title">{current.title}</h2><p>{current.detail}</p>
        </div>
        <div className="hq-command__actions"><button type="button" onClick={() => setStep((step + 1) % STEPS.length)}>{current.next} →</button><Link href={current.href}>Open workspace ↗</Link></div>
      </div> : <div className="hq-command__body">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="hq-command__eyebrow">Public product endpoints</p><button type="button" className="hq-command__check" onClick={() => void checkServices()} disabled={pending}>{pending ? 'Checking…' : 'Check services'}</button></div>
        <ul className="hq-command__services">{products.map((product) => { const result = statuses.find((item) => item.productId === product.id); return <li key={product.id}>
          <Link href={product.href}>{product.name}</Link><span data-status={result?.status ?? 'unchecked'}>{availability(result?.status)}</span>
        </li>; })}</ul>
        <div role="status" aria-live="polite" className="hq-command__status-note">{error ?? (pending ? 'Checking public endpoints…' : statuses.length ? `Checked ${new Date(statuses[0].lastChecked).toLocaleTimeString()}. Results are cached briefly.` : 'Check on demand. No background polling.')} </div>
        <p className="hq-command__status-note">Endpoint reachability does not verify every product function.</p>
        <Link href="/status" className="mt-3 inline-block text-sm text-accent">Full service status →</Link>
      </div>}
      <footer className="smohix-live-command__footer"><span>Human authority</span><span>Guarded execution</span><span>Audit evidence</span></footer>
    </div>
    <p className="smohix-live-command__preview-note">Preview the workflow. <Link href="/auth/sign-in?next=/hub" className="font-semibold text-accent">Sign in for your organization →</Link></p>
  </div>;
}
