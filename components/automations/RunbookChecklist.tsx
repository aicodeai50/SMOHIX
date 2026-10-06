"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { RunbookStep } from "@/lib/runbooks/types";
import { appBody, appMeta, appPanelTitle } from "@/lib/app-typography";

/** Local review progress only. Execution still uses the existing guarded automation flow. */
export function RunbookChecklist({ steps }: { steps: RunbookStep[] }) {
  const [completed, setCompleted] = useState(0);
  const prefix = useId();
  return <section className="rounded-xl border border-border bg-surface/80 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className={`${appPanelTitle} text-muted`}>Guided step checks</h2>
      <p className={appMeta} role="status" aria-live="polite">{completed} of {steps.length} reviewed</p>
    </div>
    <p className={`mt-3 text-muted ${appMeta}`}>Review each check in order. Progress lasts for this page visit. Checking a step does not execute a change or grant approval.</p>
    <progress className="mt-4 h-1.5 w-full accent-accent" max={Math.max(steps.length, 1)} value={completed} aria-label="Runbook review progress" />
    <ol className="mt-4 space-y-3">
      {steps.map((step, index) => <li key={step.id} className="flex gap-4 rounded-lg border border-border/60 bg-background/40 p-4">
        <input id={`${prefix}-${step.id}`} type="checkbox" checked={index < completed} disabled={index > completed}
          onChange={event => setCompleted(event.target.checked ? index + 1 : index)}
          aria-describedby={`${prefix}-${step.id}-check`} className="mt-1 h-4 w-4 shrink-0 accent-accent" />
        <div><label htmlFor={`${prefix}-${step.id}`} className={`cursor-pointer font-medium text-foreground ${appBody}`}>
          <span className="mr-2 font-mono text-accent">{index + 1}.</span>{step.title}
        </label><p id={`${prefix}-${step.id}-check`} className={`mt-1 text-muted ${appMeta}`}>{step.check}</p></div>
      </li>)}
    </ol>
    {completed > 0 && <div className="mt-5 flex flex-wrap items-center gap-4">
      <button type="button" onClick={() => setCompleted(0)} className="text-sm font-medium text-accent underline">Reset review</button>
      {completed === steps.length && <Link href="/automations" className="text-sm font-medium text-accent underline">Review automation dry-runs →</Link>}
    </div>}
  </section>;
}
