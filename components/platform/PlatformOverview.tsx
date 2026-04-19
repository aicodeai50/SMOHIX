import Link from "next/link";

const TOC = [
  { href: "#summary", label: "Overview" },
  { href: "#who", label: "Who it is for" },
  { href: "#flow", label: "Core workflow" },
  { href: "#guarded", label: "Guarded automation" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#runtime", label: "Runtime modes" },
  { href: "#differentiation", label: "Differentiation" },
  { href: "#architecture", label: "Architecture" },
] as const;

export function PlatformOverview() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent/90">
        Product narrative
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Shynvo console — what it is
      </h1>
      <p className="mt-3 text-sm text-muted">
        For investors, buyers, and new engineers: meaning first, routes second.
      </p>

      <nav
        aria-label="On this page"
        className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">On this page</p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {TOC.map((t) => (
            <li key={t.href}>
              <a href={t.href} className="text-accent hover:underline">
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="summary" className="mt-14 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">System summary</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Shynvo is a <strong className="font-medium text-foreground/90">controlled operations layer</strong>{" "}
          for IT teams. It combines <strong className="font-medium text-foreground/90">incident response</strong>,{" "}
          <strong className="font-medium text-foreground/90">guarded automation</strong> (dry-runs and
          approvals before side effects), and an{" "}
          <strong className="font-medium text-foreground/90">auditable trail</strong> of operational activity
          in one web console. Teams use it to respond when things break, propose mechanical remediation, get
          explicit sign-off where policy requires it, and leave evidence that stands up in review — without
          pretending to replace every legacy ITSM or paging vendor on day one.
        </p>
      </section>

      <section id="who" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">Who it is for</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
          <li>SRE and DevOps teams shipping and operating production services</li>
          <li>Platform engineers standardizing how change is proposed and recorded</li>
          <li>Internal IT operations groups that need defensible automation, not shadow scripts</li>
          <li>Organizations that want <span className="text-foreground/85">human-in-the-loop</span> execution with proof</li>
        </ul>
      </section>

      <section id="flow" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">Core operational flow</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          This is how modules connect in practice — the story buyers should replay in their heads.
        </p>
        <ol className="mt-6 space-y-5 text-sm leading-relaxed text-muted">
          <li className="border-l-2 border-accent/40 pl-4">
            <span className="font-medium text-foreground">Signal in</span> — HTTP alert ingest (
            <code className="rounded bg-white/[0.06] px-1 font-mono text-xs text-accent/90">
              /api/integrations/alerts
            </code>
            ) or manual creation in the console.
          </li>
          <li className="border-l-2 border-accent/40 pl-4">
            <span className="font-medium text-foreground">Incident record</span> — Open{" "}
            <Link href="/auth/sign-in?next=/incidents" className="text-accent hover:underline">
              Incidents
            </Link>
            : severity, owner, linked service, runbook, timeline when audit append is enabled.
          </li>
          <li className="border-l-2 border-accent/40 pl-4">
            <span className="font-medium text-foreground">Guidance</span> —{" "}
            <Link href="/auth/sign-in?next=/runbooks" className="text-accent hover:underline">
              Runbooks
            </Link>{" "}
            and{" "}
            <Link href="/auth/sign-in?next=/copilot" className="text-accent hover:underline">
              Copilot
            </Link>{" "}
            structure triage; nothing irreversible runs from chat alone.
          </li>
          <li className="border-l-2 border-accent/40 pl-4">
            <span className="font-medium text-foreground">Automation</span> —{" "}
            <Link href="/auth/sign-in?next=/automations" className="text-accent hover:underline">
              Automations
            </Link>{" "}
            with{" "}
            <code className="rounded bg-white/[0.06] px-1 font-mono text-xs">/api/automations/dry-run</code>{" "}
            before production calls.
          </li>
          <li className="border-l-2 border-accent/40 pl-4">
            <span className="font-medium text-foreground">Approval gate</span> —{" "}
            <Link href="/auth/sign-in?next=/approvals" className="text-accent hover:underline">
              Approvals
            </Link>{" "}
            capture decisions when your process requires them.
          </li>
          <li className="border-l-2 border-accent/40 pl-4">
            <span className="font-medium text-foreground">Evidence</span> —{" "}
            <Link href="/auth/sign-in?next=/audit" className="text-accent hover:underline">
              Audit
            </Link>{" "}
            aggregates key events; incidents support markdown export via{" "}
            <code className="rounded bg-white/[0.06] px-1 font-mono text-xs">
              /api/incidents/[id]/export
            </code>{" "}
            when backed by the database.
          </li>
        </ol>
      </section>

      <section id="guarded" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">Guarded automation model</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          &ldquo;Guarded&rdquo; means automation is <strong className="text-foreground/90">accountable</strong>, not
          silent. Today the product enforces:
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted">
          <li>
            <strong className="text-foreground/90">Dry-run</strong> path for automations before irreversible
            connector calls.
          </li>
          <li>
            <strong className="text-foreground/90">Approvals</strong> surface for explicit human decisions.
          </li>
          <li>
            <strong className="text-foreground/90">Scoped credentials</strong> — user API keys and separate alert
            ingest tokens (see Settings).
          </li>
          <li>
            <strong className="text-foreground/90">Audit-oriented logging</strong> of operational events where the
            deployment is configured to append.
          </li>
        </ul>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          <strong className="text-foreground/90">Roadmap (not implied as shipped):</strong> delegated approver roles,
          fine-grained policy DSL, automatic rollback orchestration, and deep third-party OAuth connectors — see{" "}
          <Link href="/integrations" className="text-accent hover:underline">
            Integrations
          </Link>
          .
        </p>
      </section>

      <section id="capabilities" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">Capabilities (grouped)</h2>
        <p className="mt-3 text-sm text-muted">
          Routes are implementation details; buckets are how teams buy.
        </p>
        <dl className="mt-6 space-y-6 text-sm">
          <div>
            <dt className="font-semibold text-foreground">Incident management</dt>
            <dd className="mt-1 leading-relaxed text-muted">
              List, create, drill-down, status, owner/runbook context, postmortem, timeline, export —{" "}
              <code className="font-mono text-xs text-accent/90">/incidents</code> family.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Automation and execution</dt>
            <dd className="mt-1 leading-relaxed text-muted">
              Console automations + dry-run API; optional proxies to reasoning and robot backends —{" "}
              <code className="font-mono text-xs text-accent/90">/automations</code>,{" "}
              <code className="font-mono text-xs text-accent/90">/api/automations/dry-run</code>,{" "}
              <code className="font-mono text-xs text-accent/90">/api/reasoning/*</code>,{" "}
              <code className="font-mono text-xs text-accent/90">/api/robot/*</code>.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Approvals and control</dt>
            <dd className="mt-1 leading-relaxed text-muted">
              Human checkpoint before risky automation — <code className="font-mono text-xs text-accent/90">/approvals</code>.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Audit and compliance artifacts</dt>
            <dd className="mt-1 leading-relaxed text-muted">
              Activity log + incident markdown export —{" "}
              <code className="font-mono text-xs text-accent/90">/audit</code>,{" "}
              <code className="font-mono text-xs text-accent/90">/api/incidents/[id]/export</code>.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Integrations and ingest</dt>
            <dd className="mt-1 leading-relaxed text-muted">
              Alert ingest, connector health —{" "}
              <code className="font-mono text-xs text-accent/90">/api/integrations/alerts</code>,{" "}
              <code className="font-mono text-xs text-accent/90">/api/connectors/status</code>,{" "}
              <Link href="/integrations" className="text-accent hover:underline">
                public roadmap
              </Link>
              .
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">AI copilot</dt>
            <dd className="mt-1 leading-relaxed text-muted">
              Triage chat and threads — <code className="font-mono text-xs text-accent/90">/copilot</code>,{" "}
              <code className="font-mono text-xs text-accent/90">/api/copilot/*</code>.
            </dd>
          </div>
        </dl>
      </section>

      <section id="runtime" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">Runtime modes (trust)</h2>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
          <li>
            <strong className="text-foreground/90">Production mode</strong> — Supabase-backed auth, per-user data,
            RLS, incidents in Postgres, audit append when the service role is configured, billing webhooks when
            Lemon Squeezy is wired.
          </li>
          <li>
            <strong className="text-foreground/90">Session / demo mode</strong> — When Supabase env is not
            configured, parts of the console (including incidents) can run on a browser-scoped session so the UI is
            explorable without standing up a database. Data is not shared across users or devices.
          </li>
        </ul>
      </section>

      <section id="differentiation" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">What makes this different</h2>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
          <li>
            <strong className="text-foreground/90">PagerDuty-class tools</strong> skew alerting and paging first.
            Shynvo does not claim full parity on schedules on day one; it emphasizes{" "}
            <strong className="text-foreground/90">controlled change and proof</strong> after the page.
          </li>
          <li>
            <strong className="text-foreground/90">ServiceNow-class suites</strong> skew heavyweight ITSM process.
            Shynvo is lighter: opinionated console flows with room to grow — not a full CMDB replacement in v1.
          </li>
          <li>
            Shynvo&apos;s wedge is <strong className="text-foreground/90">unified incident + guarded automation + audit</strong>{" "}
            in one product surface, so operators are not stitching three vendors together for a single incident story.
          </li>
        </ul>
      </section>

      <section id="architecture" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold text-foreground">Architecture (text)</h2>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/[0.08] bg-black/45 p-4 font-mono text-[11px] leading-relaxed text-foreground/80 sm:text-xs">
{`Users & webhooks
       │
       ▼
┌──────────────────┐
│   API layer      │  /api/integrations/alerts, /api/copilot/*,
│                  │  /api/automations/dry-run, /api/user/*, …
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  Console modules                        │
│  Incidents · Automations · Approvals   │
│  Audit · Runbooks · Copilot · Settings │
└────────┬───────────────────────────────┘
         │
         ▼
┌──────────────────┐       ┌─────────────┐
│  Supabase / DB   │       │  Connectors  │  (optional HTTP backends)
│  + audit append  │       │  reasoning   │
└────────┬─────────┘       │  robot       │
         │                 └─────────────┘
         ▼
   Export & review   (incident markdown, audit views)`}
        </pre>
      </section>

      <p className="mt-14 text-sm text-muted">
        <Link href="/" className="font-medium text-accent hover:underline">
          ← Home
        </Link>
        {" · "}
        <Link href="/docs" className="font-medium text-accent hover:underline">
          Docs hub
        </Link>
        {" · "}
        <Link href="/why" className="font-medium text-accent hover:underline">
          Why Shynvo
        </Link>
      </p>
    </article>
  );
}
