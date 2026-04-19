import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { API_GROUPS } from "@/lib/docs/api-catalog";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "HTTP API reference",
  description: "Shynvo public and authenticated API routes — methods, paths, and auth expectations.",
};

const OPENAPI_SKETCH = (base: string) => `openapi: 3.0.3
info:
  title: Shynvo API
  version: "0.1.0"
servers:
  - url: ${base}
paths:
  /api/health:
    get:
      summary: Liveness and optional deploy commit
  /api/integrations/alerts:
    post:
      summary: Alert ingest (Bearer token)
  /api/automations/dry-run:
    post:
      summary: Playbook dry-run
  /api/copilot/chat:
    post:
      summary: Copilot chat
  /api/user/api-keys:
    get:
      summary: List API keys
    post:
      summary: Create API key
`;

export default function DocsApiPage() {
  const base = getSiteUrl();
  const sketch = OPENAPI_SKETCH(base);

  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            HTTP API reference
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Minimal catalog derived from <code className="font-mono text-xs text-accent/90">app/api</code>{" "}
            route handlers. For request/response schemas, read the source or Open your deployment in
            an API client against <span className="font-mono text-xs">{getSiteUrl()}</span>.
          </p>

          <div className="mt-10 space-y-12">
            {API_GROUPS.map((g) => (
              <section key={g.id} id={g.id}>
                <h2 className="text-lg font-semibold text-foreground">{g.title}</h2>
                {g.description ? (
                  <p className="mt-1 text-sm text-muted">{g.description}</p>
                ) : null}
                <ul className="mt-4 space-y-4">
                  {g.operations.map((op) => (
                    <li
                      key={`${op.method}-${op.path}`}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-accent">
                          {op.method}
                        </span>
                        <code className="font-mono text-sm text-foreground/90">{op.path}</code>
                      </div>
                      <p className="mt-2 text-sm text-muted">{op.summary}</p>
                      {op.auth ? (
                        <p className="mt-1 text-xs text-muted">
                          <span className="font-medium text-foreground/80">Auth:</span> {op.auth}
                        </p>
                      ) : null}
                      {op.notes ? <p className="mt-1 text-xs text-muted">{op.notes}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="mt-14">
            <h2 className="text-lg font-semibold text-foreground">OpenAPI sketch</h2>
            <p className="mt-2 text-sm text-muted">
              Partial YAML for tooling; paths are abbreviated — expand in-repo before publishing a
              full spec.
            </p>
            <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-white/[0.08] bg-black/50 p-4 font-mono text-[10px] leading-relaxed text-foreground/80 sm:text-xs">
              {sketch}
            </pre>
          </section>

          <p className="mt-12 text-sm">
            <Link href="/docs" className="font-medium text-accent hover:underline">
              ← Docs hub
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
