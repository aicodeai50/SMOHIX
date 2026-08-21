import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { CodeSurface } from "@/components/architecture";
import {
  DEVELOPER_AUTH,
  DEVELOPER_ERROR_HANDLING,
  DEVELOPER_RATE_LIMITS,
  DEVELOPER_SECURITY_GUIDANCE,
  DEVELOPER_VERSIONING,
} from "@/lib/developer-journey";
import { API_GROUPS } from "@/lib/docs/api-catalog";
import { getSiteUrl } from "@/lib/site";
import { SITE_BRAND_NAME } from "@/lib/site-brand";
import { SMOHIX_AI_PUBLIC_URL } from "@/lib/product-registry";

export const metadata: Metadata = {
  title: "HTTP API reference",
  description: `${SITE_BRAND_NAME} public and authenticated API routes — authentication, endpoints, errors, and security guidance.`,
};

const OPENAPI_SKETCH = (base: string) => `openapi: 3.0.3
info:
  title: ${SITE_BRAND_NAME} API
  version: "0.1.0"
  description: Abbreviated sketch for tooling — not a full published OpenAPI document.
servers:
  - url: ${base}
paths:
  /api/health:
    get:
      summary: Liveness and uptime
  /api/integrations/alerts:
    post:
      summary: Alert ingest (Bearer ingest token)
  /api/reasoning/{path}:
    get:
      summary: Reasoning proxy (session or smohix_sk_ API key)
  /api/robot/{path}:
    get:
      summary: Robot proxy (session or smohix_sk_ API key)
  /api/user/api-keys:
    get:
      summary: List API keys (session)
    post:
      summary: Create API key (session)
`;

export default function DocsApiPage() {
  const base = getSiteUrl().replace(/\/$/, "");
  const sketch = OPENAPI_SKETCH(base);

  return (
    <>
      <Header />
      <main className="flex-1 border-b border-white/[0.06]">
        <div className="mx-auto w-full min-w-0 max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">API documentation</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            HTTP API reference
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Catalog derived from <code className="font-mono text-xs text-accent/90">app/api</code> route
            handlers in this repository. Base URL:{" "}
            <span className="break-all font-mono text-xs text-foreground/85">{base}</span>
          </p>

          <nav
            className="mt-8 flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm"
            aria-label="API documentation sections"
          >
            {[
              ["#overview", "Overview"],
              ["#authentication", "Authentication"],
              ["#quick-start", "Quick start"],
              ["#endpoints", "Endpoints"],
              ["#errors", "Errors"],
              ["#rate-limits", "Rate limits"],
              ["#webhooks", "Webhooks"],
              ["#security", "Security"],
              ["#api-keys", "API keys"],
              ["#versioning", "Versioning"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="font-medium text-muted hover:text-accent">
                {label}
              </a>
            ))}
          </nav>

          <section id="overview" className="mt-12 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Smohix HQ exposes same-origin HTTP APIs for health checks, alert/vulnerability ingest,
              console operations (session), connector proxies, and compliance assessor exports. This
              is not the Smohix AI product API at{" "}
              <a
                href={SMOHIX_AI_PUBLIC_URL}
                className="font-medium text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {SMOHIX_AI_PUBLIC_URL}
              </a>
              .
            </p>
          </section>

          <section id="authentication" className="mt-10 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">Authentication</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted">
              {DEVELOPER_AUTH.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">
              <span className="font-medium text-foreground/85">Base URL:</span>{" "}
              <code className="font-mono text-xs">{base}</code>
            </p>
          </section>

          <section id="quick-start" className="mt-10 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">Quick start</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-muted">
              <li>
                Sign in and open{" "}
                <Link href="/auth/sign-in?next=/settings/api-keys" className="font-medium text-accent hover:underline">
                  Settings → API keys
                </Link>
                .
              </li>
              <li>Create a key and store the secret once (it is not shown again).</li>
              <li>
                Call <code className="font-mono text-xs">GET /api/health</code> (public) or authenticate{" "}
                <code className="font-mono text-xs">/api/reasoning/*</code> /{" "}
                <code className="font-mono text-xs">/api/robot/*</code> with{" "}
                <code className="font-mono text-xs">Authorization: Bearer smohix_sk_…</code>.
              </li>
              <li>
                For alert ingest, create an ingest token under Integrations / Services — not an API
                key.
              </li>
            </ol>
            <p className="mt-4 text-sm">
              <Link href="/developers" className="font-medium text-accent hover:underline">
                Developer platform →
              </Link>
            </p>
          </section>

          <section id="endpoints" className="mt-12 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">Endpoints</h2>
            <p className="mt-2 text-sm text-muted">
              Grouped catalog of routes implemented in this repository. Auth expectations are taken
              from handlers — do not assume API keys work on session-only console routes.
            </p>
            <div className="mt-8 space-y-12">
              {API_GROUPS.map((g) => (
                <section key={g.id} id={g.id} className="scroll-mt-24">
                  <h3 className="text-base font-semibold text-foreground">{g.title}</h3>
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
                          <code className="break-all font-mono text-sm text-foreground/90">{op.path}</code>
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
          </section>

          <section id="errors" className="mt-12 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">Errors</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted">
              {DEVELOPER_ERROR_HANDLING.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted">
              Error bodies are typically JSON with an <code className="font-mono text-xs">error</code>{" "}
              field and optional <code className="font-mono text-xs">message</code>. Exact shapes vary
              by route.
            </p>
          </section>

          <section id="rate-limits" className="mt-10 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">{DEVELOPER_RATE_LIMITS.title}</h2>
            <p className="mt-2 text-sm text-muted">{DEVELOPER_RATE_LIMITS.body}</p>
          </section>

          <section id="webhooks" className="mt-10 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">Webhooks</h2>
            <p className="mt-2 text-sm text-muted">
              Inbound HTTP endpoints include alert and vulnerability ingest (Bearer ingest tokens,
              optional HMAC), billing provider webhooks (signature-verified), and Slack approval
              callbacks. There is no general-purpose “subscribe to events” developer webhook API in
              this repository. Org compliance modules may deliver HTTPS digests when configured in
              the console.
            </p>
            <p className="mt-3 text-sm">
              <Link href="/integrations" className="font-medium text-accent hover:underline">
                Integrations overview →
              </Link>
            </p>
          </section>

          <section id="security" className="mt-10 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
            <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-muted">
              {DEVELOPER_SECURITY_GUIDANCE.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link href="/security" className="font-medium text-accent hover:underline">
                Security →
              </Link>
              <Link href="/trust" className="font-medium text-accent hover:underline">
                Trust →
              </Link>
              <Link href="/status" className="font-medium text-accent hover:underline">
                Status →
              </Link>
            </div>
          </section>

          <section id="api-keys" className="mt-10 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">API keys</h2>
            <p className="mt-2 text-sm text-muted">
              Create and revoke keys in{" "}
              <Link href="/auth/sign-in?next=/settings/api-keys" className="font-medium text-accent hover:underline">
                Settings → API keys
              </Link>
              . Keys use the <code className="font-mono text-xs">smohix_sk_</code> prefix. They authenticate{" "}
              <code className="font-mono text-xs">/api/reasoning/*</code> and{" "}
              <code className="font-mono text-xs">/api/robot/*</code>. Keys do not currently support
              fine-grained scopes. The plaintext secret is returned once at creation. Legacy prefixes
              remain accepted for compatibility where implemented.
            </p>
          </section>

          <section id="versioning" className="mt-10 scroll-mt-24">
            <h2 className="text-lg font-semibold text-foreground">{DEVELOPER_VERSIONING.title}</h2>
            <p className="mt-2 text-sm text-muted">{DEVELOPER_VERSIONING.body}</p>
          </section>

          <section className="mt-14">
            <h2 className="text-lg font-semibold text-foreground">OpenAPI sketch</h2>
            <p className="mt-2 text-sm text-muted">
              Partial YAML for local tooling only — not a complete published OpenAPI specification.
            </p>
            <CodeSurface label="OpenAPI sketch" className="mt-4 max-h-80">
              <pre className="font-mono text-[10px] leading-relaxed text-foreground/80 sm:text-xs">
                {sketch}
              </pre>
            </CodeSurface>
          </section>

          <p className="mt-12 flex flex-wrap gap-4 text-sm">
            <Link href="/developers" className="font-medium text-accent hover:underline">
              ← Developers
            </Link>
            <Link href="/docs" className="font-medium text-accent hover:underline">
              Docs hub
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
