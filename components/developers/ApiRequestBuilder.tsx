"use client";

import { useMemo, useState } from "react";

import { buildDeveloperCode } from "@/lib/developer-request-code";
import { DEVELOPER_EXAMPLES } from "@/lib/developer-journey";
import { getSiteUrl } from "@/lib/site";
import { mBody, mBodySm } from "@/lib/marketing-layout";

function HighlightedCode({text}: {text: string}) { return <code>{text.split(/("[^"\n]*"|https?:\/\/[^\s]+|\btrue\b|\bfalse\b|\bnull\b)/g).map((token,index)=>index%2?<span key={index} className="public-code-token">{token}</span>:token)}</code>; }

type Format = "curl" | "javascript" | "typescript";

export function ApiRequestBuilder() {
  const [activeId, setActiveId] = useState(DEVELOPER_EXAMPLES[0].id);
  const [format, setFormat] = useState<Format>("curl");
  const [health, setHealth] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  async function runHealth() {
    if(pending) return;
    setPending(true); setFailure(null);
    try { const res=await fetch("/api/health",{signal:AbortSignal.timeout(8000),cache:"no-store"}); if(!res.ok) throw new Error(`HTTP ${res.status}`); setHealth(JSON.stringify(await res.json(),null,2)); }
    catch { setFailure("The public health check could not complete. Try again."); }
    finally {setPending(false);}
  }
  const base = getSiteUrl().replace(/\/$/, "");
  const example = DEVELOPER_EXAMPLES.find((e) => e.id === activeId) ?? DEVELOPER_EXAMPLES[0];

  const snippet = useMemo(() => {
    switch (format) {
      case "curl":
        return example.request.replace(/https:\/\/smohix\.run/g, base);
      case "javascript":
        return buildDeveloperCode(example, base);
      case "typescript":
        return buildDeveloperCode(example, base, true);
    }
  }, [example, format, base]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="border-b border-white/[0.08] px-5 py-4">
        <p className={mBody}>
          Generate copyable examples for protected routes. API keys, workspace ingest tokens, and signed-in sessions are separate credentials; follow the selected example. The public health check can run here without a key.
        </p>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-white/[0.08] p-2">
        {DEVELOPER_EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            disabled={pending}
            type="button"
            aria-pressed={activeId === ex.id}
            onClick={() => { setActiveId(ex.id); setHealth(null); setFailure(null); }}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-sm ${
              activeId === ex.id ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            {ex.title}
          </button>
        ))}
      </div>
      <div className="flex gap-2 border-b border-white/[0.08] p-2">
        {(["curl", "javascript", "typescript"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={format === f}
            onClick={() => setFormat(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
              format === f ? "bg-white/[0.08] text-foreground" : "text-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="p-5">
        <p className={mBody}>{example.description}</p>
        {example.notes ? <p className={`mt-2 ${mBodySm}`}>{example.notes}</p> : null}
        <div className="public-code-grid mt-4"><div>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-muted">
          Example {format === "curl" ? "request" : "code"} (not executed)
        </h3>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/40 p-4 font-mono text-xs leading-relaxed text-foreground/90">
          <HighlightedCode text={snippet} />
        </pre>
        </div><div>
        <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary-muted">
          {health ? "Live health response" : "Example response shape"}
        </h3>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/40 p-4 font-mono text-xs leading-relaxed text-foreground/90">
          <HighlightedCode text={health ?? example.response} />
        </pre>
        </div></div>
        {example.id === "health" && <button type="button" disabled={pending} onClick={() => void runHealth()} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-50">{pending ? "Checking…" : "Run public health check"}</button>}
        <p role="status" className="mt-3 text-sm text-muted">{failure ?? (health ? "Actual response from this deployment’s public liveness endpoint. This does not test database or model availability." : "Response examples are illustrative until you run a health check.")}</p>
      </div>
    </div>
  );
}
