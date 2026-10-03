'use client';
import { useEffect, useState } from 'react';
const EVENTS = ['Signal received · example service alert','Incident context assembled · owner linked','Runbook selected · example recovery procedure','Dry-run completed · no commands executed','Approval requested · waiting for an operator','Example approval recorded · human decision','Audit entry prepared · example evidence','Workflow complete · simulation only'];
export function CommandSimulation() {
  const [running,setRunning] = useState(false);
  const [tick,setTick] = useState(0);
  useEffect(()=>{
    if (!running) return;
    const timer=window.setInterval(()=>setTick(value=>value+1),2400);
    return ()=>window.clearInterval(timer);
  },[running]);
  return <div className="hq-command__body">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="hq-command__eyebrow flex items-center gap-2"><span aria-hidden className={`h-2 w-2 rounded-full bg-emerald-300 ${running?'animate-pulse motion-reduce:animate-none':''}`} />{running?'Live simulation':'Simulation paused'}</p>
      <button className="hq-command__check" type="button" onClick={()=>setRunning(value=>!value)}>{running?'Pause stream':'Start stream'}</button>
    </div>
    <p className="hq-command__status-note mb-3">Illustrative activity. No production events, approvals, or commands are executed.</p>
    <ol aria-label="Simulated command activity" className="public-activity" aria-live="off">
      {Array.from({length:Math.min(tick+1,5)},(_,i)=>Math.max(0,tick-4)+i).map(index=><li key={index}><span className="text-accent">{String(index+1).padStart(2,'0')}</span> · {EVENTS[index%EVENTS.length]}</li>)}
    </ol>
  </div>;
}
