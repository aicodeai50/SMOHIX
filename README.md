# Zentro Platform (web)

Next.js app for [zentro.run](https://zentro.run): marketing site + console shell.

**Roadmap & completion checklist:** [`docs/PLATFORM_PLAN.md`](docs/PLATFORM_PLAN.md) · **Vision & long-term direction:** [`docs/VISION_AND_ROADMAP.md`](docs/VISION_AND_ROADMAP.md) (also **`/vision`** in the signed-in console). **Database (Supabase / Postgres):** run SQL migrations **in order** in the Supabase SQL editor (same filenames under [`supabase/migrations/`](supabase/migrations/)):

1. `20260418120000_platform_spine.sql`
2. `20260418130000_incidents.sql`
3. `20260418140000_console_extensions.sql`
4. `20260418150000_api_keys.sql`
5. `20260418160000_automation_dry_runs.sql`
6. `20260419120000_services_alert_ingest.sql`
7. `20260419130000_automation_dry_runs_incident_id.sql`
8. `20260420100000_incident_owner_runbook.sql`
9. `20260420120000_equipment_operations.sql`
10. `20260425113000_decision_intelligence.sql`
11. `20260426203000_incident_rca_runs.sql`
12. `20260426211000_change_risk_scores.sql`
13. `20260426214000_service_slos_error_budgets.sql`
14. `20260426221000_dependencies_and_remediation.sql`
15. `20260524120000_postgres_excellence.sql` — indexes, constraints, retention helpers, `zentro_db_health()`
16. `20260525120000_vulnerability_pentest.sql` — `vulnerability_findings`, `pen_test_engagements`
17. `20260526120000_org_rbac.sql` — `organizations`, `organization_members`, org-scoped approvals RLS
18. `20260527120000_org_resource_scope.sql` — org scope for incidents, services, automation history
19. `20260528120000_pentest_finding_rollup.sql` — link findings to engagements, `increment_pen_test_findings_count()`
20. `20260529120000_org_slo_dependencies_scope.sql` — org scope for SLOs, error budgets, dependency graph
21. `20260530120000_fedramp_deployment_profile.sql` — org deployment tier, data region, and boundary columns
22. `20260531120000_org_audit_scope.sql` — org-scoped audit_log with member RLS
23. `20260532120000_org_retention_policies.sql` — tier-based audit/incident retention overrides and purge helpers
24. `20260533120000_legal_hold_markers.sql` — legal hold on incidents/audit; retention purge skips held rows
25. `20260534120000_compliance_evidence_bundles.sql` — tamper-evident assessor bundles + optional delivery webhook

**Fresh project:** run [`supabase/apply-all-migrations.sql`](supabase/apply-all-migrations.sql) once (regenerate with `npm run db:bundle`). **Existing project:** apply only migrations you have not run yet.

**Supabase CLI (recommended):** `supabase link --project-ref YOUR_REF` then `supabase db push`. Config: [`supabase/config.toml`](supabase/config.toml). Regenerate TypeScript types: `supabase gen types typescript --linked > lib/supabase/database.types.ts`.

**Postgres health:** after migration #15, `GET /api/health/db` returns Postgres version and server time (separate from Railway liveness at `/api/health`).

## Run locally (preview UI)

```bash
npm install
npm run dev
```

Open **http://localhost:3000** (marketing) and **http://localhost:3000/hub** (console hub — works without Supabase; Copilot uses `/api/copilot/chat` with offline or OpenAI).

## GitHub: `ZENTRO`

1. On GitHub, create a new repo named **ZENTRO** (empty — no README/License if you want zero merge friction).
2. From the folder that contains this project:

**Option A — this `web` folder is the repo root** (simplest for Railway):

```bash
cd web
git init
git add .
git commit -m "Initial Zentro web app"
git branch -M main
git remote add origin https://github.com/aicodeai50/ZENTRO.git
git push -u origin main
```

If GitHub shows an error because the remote already has a commit (e.g. you used GitHub’s “add README” wizard), run once before `git push`:

```bash
git pull origin main --allow-unrelated-histories
```

Resolve any merge (keep this project’s `README.md` if asked), then `git push -u origin main`.

**Windows:** install [Git for Windows](https://git-scm.com/download/win) or use **GitHub Desktop** → add the `web` folder → publish to `aicodeai50/ZENTRO`.

**Option B — monorepo** (e.g. `ZENTRO/web`):

Push the parent folder instead and set **Railway Root Directory** to `web`.

## Environment variables

Copy `.env.example` to `.env.local` and fill in values.

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (auth). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (with URL, protects console routes). |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Required for Lemon webhooks to upsert `subscriptions` (never expose to the client). |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | Lemon product checkout link (CTAs use this when set). |
| `LEMONSQUEEZY_WEBHOOK_SIGNING_SECRET` | Lemon webhook signing secret. |

Webhook URL in Lemon: `https://zentro.run/api/webhooks/lemonsqueezy` (use your production domain).

**Checkout → user link:** paid flows should use `getCheckoutUrlForUser(userId)` from `lib/billing.ts` so Lemon sends `meta.custom_data.zentro_user_id` (plus legacy key) and webhooks can attach rows in `public.subscriptions`.

**Checkout key migration (temporary compatibility):**

- New canonical key: `zentro_user_id`
- Current checkout helpers send **both** keys for safe rollout across environments.
- Recommended sunset for legacy key: **2026-08-31** (or after one full billing cycle in your prod workspace).
- Sunset steps:
  1. Confirm incoming Lemon webhook payloads include `zentro_user_id`.
  2. Keep parser strict to `zentro_user_id` (+ optional `supabase_user_id` fallback only).
  3. Keep checkout helpers writing only `zentro_user_id`.
  4. Run `npm run test:security` and a test checkout/webhook in staging before production deploy.

## Railway (deploy now)

Repo: **`aicodeai50/ZENTRO`**, branch **`main`**. This project ships **`railway.json`**: Railpack runs **`npm run build`**, start **`npm run start`**, healthcheck **`/api/health`** (see `app/api/health/route.ts`).

**Deploy-first (smoke test before building more):**

1. Push **`web/`** as the repo root (or set **Root Directory** to `web` in Railway).
2. In **Supabase**, run all migrations in order (see top of this README) so auth, incidents, billing, services, and ingest tables exist.
3. In **Railway → Variables**, set at least **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**, **`SUPABASE_SERVICE_ROLE_KEY`**, and **`NEXT_PUBLIC_SITE_URL`** (your Railway URL or custom domain). Add **`OPENAI_API_KEY`** only if you want cloud Copilot in prod.
4. In **Supabase → Authentication → URL configuration**, set **Site URL** and **Redirect URLs** to your production origin and `/auth/callback`.
5. Deploy, then verify **`GET /api/health`** (200) and sign in → **`/hub`**. Fix **Target port** vs **`Network: 0.0.0.0:PORT`** in logs if you see 502 (see below).

### 1. Service → Source

1. Open your Railway project → the **web** service (or create a service from **Empty** then attach GitHub).
2. **Settings** → **Source** → **Connect Repo** → pick **`aicodeai50/ZENTRO`**.
3. **Branch**: **`main`**.
4. **Root Directory**: leave **empty** (repo root is the Next app). Only set **`web`** if your GitHub layout is `ZENTRO/web/...`.

Save. Railway should start a deploy within a minute.

### 2. Variables (service → Variables)

Add anything you use in production (same names as `.env.example`):

| Name | Notes |
|------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://zentro.run` (optional; helps metadata when not using the default). |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | Your Lemon checkout link. |
| `LEMONSQUEEZY_WEBHOOK_SIGNING_SECRET` | Webhook signing secret (server only). |
| `ZENTRO_REASONING_API_URL` | Your reasoning API base URL (**server only**; set in Railway, not `NEXT_PUBLIC_`). |
| `ZENTRO_ROBOT_API_URL` | Your automation service base URL (**server only**). Used on **Settings → Connectors** for health checks. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (see **Supabase (auth)** below). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (set with URL above). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (**server only**); required for `/api/webhooks/lemonsqueezy` to write subscriptions. |
| `DEMO_VIDEO_URL` | Optional. Full HTTPS URL of your hosted product demo (YouTube watch link, Loom share, Vimeo, or direct `.mp4`). **Server-only** — `/docs/demo` reads it at runtime; changing it in Railway updates the embed after redeploy/restart without rebuilding from scratch for that alone. Not a secret; convenient as a variable. |

`PORT`: Railway often injects **`PORT` automatically** (commonly **`8080`** on new services). **Next.js always listens on whatever `PORT` is set to** — check your **Deploy logs** for the line `Network: http://0.0.0.0:XXXX`; that **`XXXX` is the only port** your public domain’s **Target port** must use (unless you override `PORT`).

### Target port (Generate Domain / Custom Domain)

The **Target port** in the Railway UI must match **the port in your start logs** (e.g. `Network: http://0.0.0.0:8080` → target **8080**). Guessing **3000** when the app is on **8080** causes **502 / “Application failed to respond”**.

1. Open **Deploy logs** and note the port after `0.0.0.0:` (often **8080** on Railway).
2. **Networking** → your domain → **Target port** = that same number.
3. **Optional:** in **Variables**, set **`PORT`** = **`3000`** if you prefer; then set **Target port** to **`3000`** and redeploy so logs show `0.0.0.0:3000`.

If target port ≠ listen port, you’ll get **502 / connection refused** even when the deploy is “green”.

### 3. Public URL

**Networking** → **Generate Domain** (or use your `*.up.railway.app` URL). Open it — you should see the marketing home page.

### 4. Custom domain `zentro.run`

**Networking** → **Custom Domain** → add **`zentro.run`** (and **`www.zentro.run`** if you use it).  
Set **Target port** to the same value as **`PORT`** / the **`Network: … 0.0.0.0:PORT`** line in deploy logs (often **8080** unless you set **`PORT=3000`**).  
At your DNS provider, add the **CNAME / ALIAS** records Railway shows.  
The app’s **middleware** redirects `www` → apex.

### 5. Lemon webhooks

After `zentro.run` resolves to Railway, set the Lemon webhook URL to:

`https://zentro.run/api/webhooks/lemonsqueezy`

### Troubleshooting

**“Connected branch does not exist”** — GitHub must have a **`main`** branch with at least one commit (push from the GitHub section above).

**Build fails** — open the deploy **Build logs**; common fixes: wrong **Root Directory**, or Node version (this app expects **Node ≥ 20**; Railway/Railpack usually picks 20+ automatically).

**“Application failed to respond”** — the container is not accepting HTTP on the port Railway expects.

1. **Port match:** in deploy logs, find **`Network: http://0.0.0.0:PORT`**. Set the custom domain **Target port** in Railway to that **`PORT`** (e.g. **8080**). Or set **`PORT=3000`** in Variables, redeploy, and use target **3000** — both sides must agree.
2. **Deploy logs:** open **Deployments** → latest → **Deploy logs** (and **Build logs**) for stack traces or exit codes.
3. This repo uses **`npm run start`** → `next start --hostname 0.0.0.0` so the server listens on **all interfaces** inside the container (Railway must reach the process on **`PORT`**).
4. **Verify liveness:** from your machine, `curl -sS -D - "https://YOUR-SERVICE.up.railway.app/api/health"` (or your custom domain) — expect **`200`** and JSON with `"ok":true`. **`HEAD /api/health`** is supported for probes that use HEAD.
5. If **`/api/health`** is **200** from inside the service but the public URL fails, the edge is usually **wrong Target port** vs the log port (e.g. app on **8080**, domain aimed at **3000**) or DNS still propagating.

**`npm warn config production Use --omit=dev instead`** — harmless Railway/npm noise; not a crash.

**Still seeing the old UI after a git push?**

1. **Deployments** → click the **latest** deploy. If it is **FAILED** or **CRASHED**, open **Build logs** / **Deploy logs** — Railway keeps serving the **last successful** deploy until a new one goes green.
2. **Settings → Source**: confirm **Branch** is **`main`** and the repo is **`aicodeai50/ZENTRO`**. Use **Disconnect** / **Reconnect** if pushes never trigger a deploy.
3. **Redeploy**: on the latest deployment menu, choose **Redeploy** (or **Restart** only restarts the same image — you want a **new build** when code changed). If Railway offers **Clear build cache**, use it once.
4. **One-shot cache bust**: add variable **`NIXPACKS_NO_CACHE`** = **`1`**, redeploy, then **remove** the variable (optional; forces Nixpacks to rebuild layers).
5. **Confirm web tier is up**: `curl -sS "https://YOUR-URL.up.railway.app/api/health"` — expect **`ok: true`** and a valid **`uptime_s`** value.
6. **Browser**: hard refresh (**Ctrl+Shift+R**) or a private window — stale JS/CSS can look like an old release even when the server is new.

### Supabase (auth)

The app uses **email + password** via **`@supabase/ssr`**. Routes: **`/auth/sign-up`**, **`/auth/sign-in`**, **`/auth/callback`** (email confirmation), **`POST /auth/sign-out`**.

**Variables** (Railway + `.env.local`): **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**. Optional server-only **`SUPABASE_SERVICE_ROLE_KEY`** for admin tasks (never expose to the client).

**Supabase dashboard → Authentication → URL configuration**

- **Site URL:** your production origin (e.g. `https://zentro.run`).
- **Redirect URLs:** include `https://zentro.run/auth/callback` and `http://localhost:3000/auth/callback` for local dev.

When both public Supabase vars are set, **middleware** requires a session for **`/hub`**, **`/overview`**, **`/copilot`**, **`/incidents`**, **`/services`**, **`/automations`**, **`/runbooks`**, **`/approvals`**, **`/audit`**, and **`/settings/**`**. If the vars are **omitted**, the console stays open without login (useful for local UI work).

**Postgres tuning (migration #15):** hot-path indexes, `incidents.status` CHECK constraint, JSONB GIN on `audit_log.details`, and retention helpers (`purge_stale_audit_log`, etc.). After applying, verify with **`GET /api/health/db`**. Optional scheduled cleanup in Supabase → **Database → Extensions** → enable **pg_cron**, then schedule (service role):

```sql
select cron.schedule('zentro-audit-retention', '0 3 * * 0', $$
  select public.purge_stale_audit_log(180);
$$);
```

**Next for billing:** map Lemon Squeezy / webhooks to the signed-in user (e.g. store `user.id` or email in your billing metadata). **Still recommended:** session or API-key checks on **`/api/reasoning`** and **`/api/robot`** when auth env is set (already implemented).

## Connecting external services to the app

Browsers should **not** call your `*.up.railway.app` URLs directly (CORS, and you keep service URLs off the client). Use **same-origin** routes on this app; Next forwards to your configured services using env vars.

### Railway Variables (server only)

- `ZENTRO_REASONING_API_URL` — base URL, no trailing slash (e.g. `https://your-api.up.railway.app`).
- `ZENTRO_ROBOT_API_URL` — same for the automation service.

### Reverse proxy routes (send any path)

| Your frontend calls | Upstream request |
|---------------------|------------------|
| `GET /api/reasoning/health` | `GET {ZENTRO_REASONING_API_URL}/health` |
| `POST /api/reasoning/v1/chat` | `POST {ZENTRO_REASONING_API_URL}/v1/chat` |
| `GET /api/robot/docs` | `GET {ZENTRO_ROBOT_API_URL}/docs` |
| `GET /api/robot/health` | `GET {ZENTRO_ROBOT_API_URL}/health` |

Query string, method, and body are forwarded. Headers forwarded: **`Content-Type`**, **`Accept`**, and **`Authorization`** only when it is **not** a Zentro API key (`zentro_sk_...`), so your upstream never receives credentials issued by this app.

When Supabase auth env vars are set, callers must use a **browser session** or an **API key** from **Settings → API keys** (`Authorization: Bearer <key>` or `X-Zentro-Api-Key`). Resolving keys by hash uses **`SUPABASE_SERVICE_ROLE_KEY`** on the server.

**Examples (client or Server Component):**

```ts
// Reasoning API health
const r = await fetch("/api/reasoning/health", { cache: "no-store" });

// Robot OpenAPI docs (HTML/JSON depending on upstream)
const docs = await fetch("/api/robot/docs", { cache: "no-store" });

// POST example — path must match your upstream route
await fetch("/api/reasoning/your/path/here", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "hello" }),
});
```

Path segments cannot contain `..` or `/` (basic hardening). For public internet traffic, **add authentication** (middleware or per-route) so this is not an open relay.

### Other helpers

| Route | Role |
|--------|------|
| **`GET /api/connectors/status`** | JSON snapshot of reasoning + automation reachability (health probe). |
| **`/settings/billing`** | Plan, Lemon checkout with `zentro_user_id`, subscription snapshot. |
| **`/settings/connectors`** | UI for the same probes. |
| **`/copilot`** | Shows connection status from the server. |

### Monitoring alert ingest (Datadog first adapter)

`POST /api/integrations/alerts` accepts:

- **Native Zentro ingest shape** (`title`, `severity`, `service_name`, `dedupe_key`, etc.)
- **Datadog event/webhook-like payloads** (auto-normalized to incidents)

For Datadog:

- If payload includes event id, dedupe uses `external_ref = datadog:<event_id>`.
- `alert_type` / `priority` are mapped to Zentro severity.
- Tags like `service:<name>`, `owner:<team>`, `runbook:<slug>` are mapped when present.

Optional header for explicit source hint:

- `X-Zentro-Alert-Source: datadog`

Example:

```bash
curl -X POST "https://zentro.run/api/integrations/alerts" \
  -H "Authorization: Bearer zentro_ingest_xxx" \
  -H "Content-Type: application/json" \
  -H "X-Zentro-Alert-Source: datadog" \
  -d '{
    "id": 987654321,
    "title": "API 5xx spike",
    "text": "Error rate is above threshold on payments-api",
    "alert_type": "error",
    "tags": ["service:payments-api", "owner:platform", "runbook:incident-triage"]
  }'
```

### Monitoring alert ingest (Prometheus / Grafana Alertmanager adapter)

The same endpoint also accepts Alertmanager payload shape (`status`, `alerts[]`, `labels`,
`annotations`) and maps it to incidents automatically.

For Prometheus/Grafana:

- `labels.severity` maps to Zentro severity (`critical`/`warning`/`info` etc).
- `labels.service`/`job`/`app` can map `service_name`.
- `labels.owner` or `labels.team` can map `owner_hint`.
- `labels.runbook` can map `runbook_slug` when valid.
- `fingerprint` dedupes as `prometheus:<fingerprint>`.

Optional header for explicit source hint:

- `X-Zentro-Alert-Source: prometheus` (or `grafana`)

Example:

```bash
curl -X POST "https://zentro.run/api/integrations/alerts" \
  -H "Authorization: Bearer zentro_ingest_xxx" \
  -H "Content-Type: application/json" \
  -H "X-Zentro-Alert-Source: prometheus" \
  -d '{
    "status": "firing",
    "alerts": [
      {
        "status": "firing",
        "labels": {
          "alertname": "HighErrorRate",
          "severity": "critical",
          "service": "payments-api",
          "team": "platform"
        },
        "annotations": {
          "summary": "5xx error rate above threshold"
        },
        "fingerprint": "abc123def456"
      }
    ]
  }'
```

### Monitoring alert ingest (PagerDuty events adapter)

The same endpoint accepts PagerDuty Events-style payloads and maps:

- `event_action` (`trigger`/`resolve`) to incident status.
- `payload.severity` / `payload.urgency` to Zentro severity.
- `dedup_key` to `external_ref` as `pagerduty:<dedup_key>`.
- `payload.component`/`source` to `service_name`.
- optional `payload.custom_details.owner_hint`, `team`, `runbook_slug`.

Optional header for explicit source hint:

- `X-Zentro-Alert-Source: pagerduty`

Example:

```bash
curl -X POST "https://zentro.run/api/integrations/alerts" \
  -H "Authorization: Bearer zentro_ingest_xxx" \
  -H "Content-Type: application/json" \
  -H "X-Zentro-Alert-Source: pagerduty" \
  -d '{
    "event_action": "trigger",
    "dedup_key": "payments-api-5xx",
    "payload": {
      "summary": "payments-api error budget burn",
      "source": "payments-api",
      "component": "payments-api",
      "severity": "critical",
      "custom_details": {
        "owner_hint": "platform-oncall",
        "runbook_slug": "incident-triage"
      }
    }
  }'
```

### Monitoring alert ingest (New Relic adapter)

The same endpoint accepts New Relic-style incident webhook payloads and maps:

- `current_state` (`open`/`closed`) to incident status.
- `severity`/`priority` to Zentro severity.
- `incident_id` (or violation id in details) to dedupe key `newrelic:<id>`.
- `labels.service` or target labels to `service_name`.

Optional header for explicit source hint:

- `X-Zentro-Alert-Source: newrelic`

### Monitoring alert ingest (Splunk adapter)

Send Splunk alert action / webhook JSON to the same endpoint. Zentro maps:

- `search_name` / `rule_name` → title
- `result.severity` → Zentro severity
- `sid` or `event_id` → dedupe key `splunk:<id>`
- `result.host` → `service_name` hint

Optional header: `X-Zentro-Alert-Source: splunk` (or set `"vendor": "splunk"` in JSON body).

```bash
curl -X POST "https://zentro.run/api/integrations/alerts" \
  -H "Authorization: Bearer YOUR_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Zentro-Alert-Source: splunk" \
  -d '{
    "search_name": "Failed logins threshold",
    "sid": "scheduler_12345",
    "result": { "severity": "critical", "host": "auth-01", "_raw": "failed login burst" }
  }'
```

### Monitoring alert ingest (Microsoft Sentinel adapter)

Accepts Sentinel / Azure Monitor alert JSON (`properties.displayName`, `properties.severity`, `properties.alertId`, or `data.essentials.*`):

- `properties.alertId` → dedupe `sentinel:<id>`
- `properties.severity` → Zentro severity
- `data.essentials.monitorCondition` → resolved vs investigating

Optional header: `X-Zentro-Alert-Source: sentinel`

### Monitoring alert ingest (CrowdStrike Falcon adapter)

Accepts Falcon detection webhook shape (`event.DetectName`, `event.DetectId`, `event.Severity`, `event.ComputerName`) or flat `detection_id` payloads:

- `DetectId` / `detection_id` → dedupe `crowdstrike:<id>`
- Numeric `Severity` (1–5) → Zentro severity
- `ComputerName` → service name hint

Optional header: `X-Zentro-Alert-Source: crowdstrike`

### Vulnerability scanner ingest (Qualys / Tenable)

`POST /api/integrations/vulnerabilities` accepts Qualys, Tenable/Nessus, or generic finding JSON with the same **Bearer ingest token** as alert ingest. Findings upsert into **`vulnerability_findings`**; high/critical severities auto-open linked incidents.

Qualys example (`QID`, `TITLE`, `HOST`, `CVSS_BASE`, `CVE_ID`):

```bash
curl -X POST "https://zentro.run/api/integrations/vulnerabilities" \
  -H "Authorization: Bearer YOUR_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Zentro-Vuln-Source: qualys" \
  -d '{
    "QID": "38173",
    "TITLE": "SSL Certificate Expiry",
    "CVSS_BASE": "7.5",
    "CVE_ID": "CVE-2024-0001",
    "HOST": { "IP": "10.0.0.5", "DNS": "api.internal" }
  }'
```

Tenable example (`plugin.id`, `plugin.name`, `asset.hostname`):

```bash
curl -X POST "https://zentro.run/api/integrations/vulnerabilities" \
  -H "Authorization: Bearer YOUR_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Zentro-Vuln-Source: tenable" \
  -d '{
    "plugin": {
      "id": "19506",
      "name": "SSL Certificate Cannot Be Trusted",
      "cvss_base_score": 9.1,
      "cve": ["CVE-2023-9999"]
    },
    "asset": { "hostname": "edge.zentro.run" }
  }'
```

Console: **`/assets/vulnerabilities`** (prioritized exposure queue) · **`/changes/pentest`** (engagement scope windows).

**Exposure prioritization:** findings are ranked at read time by an exposure score combining CVSS (or severity fallback), asset criticality from the **service catalog** (production matches rank highest), and recency for open findings. The console shows priority bands, matched service names, and stats for urgent and production-asset exposure. Regression: `npm run test:vulnerability-priority`.

**Pen-test finding rollup (migration #19):** when a **new** finding is ingested and its `asset_host` matches an **active** engagement scope (or the engagement is within its scheduled window), Zentro links the finding and increments `findings_count`. Force a target engagement with header `X-Zentro-Pen-Test-Engagement: <engagement_uuid>`. Response fields: `pen_test_engagement_id`, `pen_test_rolled_up`.

### Organization RBAC (delegated approvers)

After migration **#17**, create an organization at **`/settings/members`**. Roles:

| Role | Approvals | Policy review |
|------|-----------|---------------|
| Owner / Admin | Decide all pending | Accept/reject suggestions |
| Approver | Decide all pending | Read-only |
| Security reviewer | High-risk only (score 70+) | Accept/reject suggestions |
| Operator | Submit requests | Read-only |
| Viewer | Read-only | Read-only |

Org-scoped approval requests share a queue at **`/approvals`**. Delegated approvers **cannot approve their own requests**. Org-scoped items must be decided in the console (Slack webhook returns 403 for org rows).

Invite teammates by email (they must already have a Zentro account). Requires **`SUPABASE_SERVICE_ROLE_KEY`** for email lookup.

**Org-wide resources (migration #18):** when an organization is active (`zentro_org_id` cookie), incidents, services, and automation dry-runs/executions are shared across org members. Legacy personal rows (`org_id` null) remain visible alongside org rows. Alert ingest attributes incidents to the user's primary org when membership exists.

**Org SLO & dependencies (migration #20):** SLO configs, error budget burn snapshots, and service dependency edges follow the same org scope. **`/services`** burn triage and **`/overview`** error-budget widgets aggregate org-wide data; automation guardrails use org-scoped burn state when blocking critical-budget executions. Regression: `npm run test:org-slo-scope`.

**Attack path simulation:** ranks what-if lateral movement paths from open high/critical vulnerability findings (matched to catalog hosts) through dependency edges to **production** services. Console: **`/assets/attack-paths`** · API: **`GET /api/attack-paths/simulate`**. Regression: `npm run test:attack-path-sim`.

**Compliance control mapping:** maps representative **SOC 2** and **ISO 27001** controls to `audit_log` event types and accepted automation policies. Coverage matrix at **`/governance/compliance`**; control badges on **`/audit`**. API: **`GET /api/governance/compliance/summary`**. Regression: `npm run test:compliance-mapping`.

**Compliance evidence export:** downloadable assessor pack — audit events and accepted policies with SOC 2 / ISO control columns. Export buttons on **`/governance/compliance`** · API: **`GET /api/governance/compliance/export?window=30d|7d|24h|all&format=csv|json`**. Appends `governance.compliance_exported` audit event. Regression: `npm run test:compliance-export`.

**FedRAMP-oriented deployment (migration #21):** org-level **deployment tier**, **data region**, and **data boundary** (shared / dedicated project / GovCloud). Console: **`/settings/deployment`** · API: **`GET /api/deployment/profile`**. FedRAMP-ready tier validates GovCloud region + boundary. Regression: `npm run test:fedramp-deployment`.

**Org-scoped audit log (migration #22):** `audit_log` rows carry **`org_id`** when an organization is active; members see org-wide evidence at **`/audit`** with **role-aware event filters** (viewer/operator/approver subsets). CSV export gated by role. Compliance summaries and evidence packs include org-scoped audit rows. Regression: `npm run test:org-audit-scope`.

**Custom retention policies (migration #23):** org-level **audit** and **closed incident** retention overrides on **`/settings/deployment`**, capped by deployment tier (standard / regulated / FedRAMP-ready). API: **`GET /api/deployment/retention`**. Postgres helpers: **`apply_org_retention_policy(org_id)`**, **`purge_stale_org_audit_log`**, **`purge_stale_org_incidents`**. Regression: `npm run test:retention-policy`.

**Legal hold markers (migration #24):** freeze incidents and linked audit rows from retention purge. Console: **`/governance/legal-holds`** and per-incident controls on **`/incidents/[id]`** (owner/admin). API: **`GET /api/governance/legal-holds`**. Audit events: `governance.legal_hold_set` / `governance.legal_hold_cleared`. Regression: `npm run test:legal-hold`.

**Assessor evidence bundles (migration #25):** persisted compliance snapshots with **SHA-256 tamper-evident manifests** (JSON + CSV artifacts). Console: **`/governance/compliance/bundles`** · APIs: **`POST/GET /api/governance/compliance/bundles`**, **`GET .../bundles/[id]/download`**, scheduled **`POST .../bundles/scheduled`** (Bearer `ZENTRO_BUNDLE_CRON_SECRET`). Optional org **`evidence_bundle_webhook_url`** for HTTPS delivery. Regression: `npm run test:evidence-bundle`.

**SOC 2 Type II report mode (migration #26):** continuous control monitoring with **30d vs prior 30d** trends, exceptions, and readiness score. External **`auditor`** org role gets a read-only workspace (governance/compliance + audit only). Console: **`/governance/compliance/type-ii`** · API: **`GET /api/governance/compliance/type-ii?periodDays=30`**. Regression: `npm run test:soc2-type-ii`.

**ISO 27001 continuous assessment (no migration):** Annex A control trends, **domain readiness** rollup, and gap analysis parallel to SOC 2 Type II (same audit/policy evidence model). Console: **`/governance/compliance/iso-assessment`** · API: **`GET /api/governance/compliance/iso-assessment?periodDays=30`**. Shared engine: **`lib/compliance/continuous-assessment.ts`**. Regression: `npm run test:iso-assessment`.

**Control attestation workflows (migration #27):** per-control **owner**, **due date**, and **sign-off** with append-only trail and links to mapped audit evidence (30d window). Console: **`/governance/compliance/attestations`** · API: **`GET /api/governance/compliance/attestations`**. Audit events: `governance.control_attestation_assigned`, `governance.control_attestation_signed`. Owner/admin assign; assigned owner or admin attests. Regression: `npm run test:control-attestation`.

**Third-party risk register (migration #28):** vendor inventory with **control inheritance** from risk tier + category and **evidence reuse** (org attestation status + 30d audit counts per inherited SOC 2 / ISO control). Console: **`/governance/third-party-risk`** · API: **`GET/POST /api/governance/third-party/vendors`**. Regression: `npm run test:third-party-risk`.

**Compliance program dashboard (no migration):** executive rollup of **SOC 2 Type II**, **ISO 27001 assessment**, **control attestations**, and **third-party vendor risk** with weighted program readiness, top gaps, and overdue attestations. Console: **`/governance/compliance/program`** · API: **`GET /api/governance/compliance/program?periodDays=30`**. Regression: `npm run test:compliance-program`.

**PCI DSS control pack (no migration):** eleven representative **PCI DSS v4** requirements mapped to shared audit/policy evidence with readiness scoring and gap analysis. Console: **`/governance/compliance/pci-dss`** · API: **`GET /api/governance/compliance/pci-dss?periodDays=30`**. Evidence export CSV/JSON includes **`pci_dss_controls`** column. Included in program dashboard rollup. Regression: `npm run test:pci-dss`.

**HIPAA Security Rule mapping (migration #29):** eleven **45 CFR 164** administrative, physical, and technical safeguards with readiness scoring and gap analysis. Console: **`/governance/compliance/hipaa`** · API: **`GET /api/governance/compliance/hipaa?periodDays=30`**. **`healthcare_baa`** vendor category inherits full HIPAA control set for BAA third-party risk. Evidence export adds **`hipaa_controls`** column. Regression: `npm run test:hipaa`.

30. `20260539120000_compliance_digest_webhooks.sql` — compliance digest webhook URL + delivery log
31. `20260540120000_compliance_sla_reminders.sql` — SLA reminder org settings + delivery dedup log
33. `20260542120000_compliance_gap_remediations.sql` — gap-to-runbook remediation tracking
34. `20260543120000_compliance_assessor_evidence_requests.sql` — assessor evidence request workflow
35. `20260544120000_compliance_mapping_digest.sql` — mapping change digest webhook/email
36. `20260545120000_compliance_attestation_renewal.sql` — attestation renewal nudge settings + dedup log
37. `20260546120000_compliance_evidence_request_sla.sql` — evidence request SLA settings + digest deliveries
38. `20260547120000_compliance_obligation_consolidation.sql` — crossover cluster consolidation play tracking
39. `20260548120000_compliance_obligation_committee_digest.sql` — quarterly committee digest email + webhook
40. `20260549120000_compliance_obligation_density_alerts.sql` — obligation density alert thresholds + delivery log
41. `20260550120000_compliance_committee_capacity_budget.sql` — committee capacity hours per obligation and per owner-week
42. `20260551120000_compliance_peak_week_staffing_digest.sql` — peak-week staffing digest email + webhook + delivery log
43. `20260552120000_compliance_obligation_staffing_actions.sql` — staffing action tracker for load-balance and capacity relief
44. `20260553120000_compliance_staffing_action_overdue_reminders.sql` — overdue staffing reminder settings + dedup log
32. `20260541120000_compliance_assessor_api_tokens.sql` — org-scoped assessor API tokens (zentro_ca_*)

**NIST CSF 2.0 alignment (no migration):** twelve representative **NIST Cybersecurity Framework 2.0** outcomes across core functions with **implementation maturity tiers** (Partial → Adaptive) from shared audit/policy evidence. Console: **`/governance/compliance/nist-csf`** · API: **`GET /api/governance/compliance/nist-csf?periodDays=30`**. Program dashboard includes NIST maturity and readiness. Evidence export adds **`nist_csf_controls`** column. Regression: `npm run test:nist-csf`.

**CIS Controls v8 safeguard pack (no migration):** twelve representative **CIS v8** safeguards across **Implementation Groups IG1–IG3** with IG readiness scoring and attained posture from shared audit/policy evidence. Console: **`/governance/compliance/cis-v8`** · API: **`GET /api/governance/compliance/cis-v8?periodDays=30`**. Program dashboard includes CIS IG posture. Evidence export adds **`cis_v8_controls`** column. Regression: `npm run test:cis-v8`.

**CMMC 2.0 Level 2 control overlay (no migration):** twelve representative **NIST SP 800-171 Rev 2** practices for CMMC Level 2 with **SPRS-style scoring** (0–110) and 800-171 family readiness from shared audit/policy evidence. Console: **`/governance/compliance/cmmc-l2`** · API: **`GET /api/governance/compliance/cmmc-l2?periodDays=30`**. Program dashboard includes SPRS score and band. Evidence export adds **`cmmc_l2_controls`** column. Regression: `npm run test:cmmc-l2`.

**GDPR Article 32 technical measures (no migration):** twelve **Article 32(1)** security-of-processing measures with **DPA-oriented readiness bands** from shared audit/policy evidence. Console: **`/governance/compliance/gdpr-art32`** · API: **`GET /api/governance/compliance/gdpr-art32?periodDays=30`**. Program dashboard includes GDPR Art. 32 posture. Evidence export adds **`gdpr_art32_controls`** column. Regression: `npm run test:gdpr-art32`.

**SOC 2 / ISO 27001 crosswalk export (no migration):** downloadable **mapping matrix** linking catalog SOC 2 Trust Services Criteria to ISO 27001:2022 Annex A with **30-day evidence overlay** (status and audit event counts per control). Console: **`/governance/compliance/crosswalk`** · API: **`GET /api/governance/compliance/crosswalk?periodDays=30`** (CSV default, `format=json` optional). Audit event: `governance.soc2_iso_crosswalk_exported`. Regression: `npm run test:soc2-iso-crosswalk`.

**Unified assessor workbook export (no migration):** single **ZIP** bundling compliance evidence (JSON + CSV), SOC 2 / ISO crosswalk, and framework assessment reports (SOC 2 Type II, ISO, PCI, HIPAA, NIST, CIS, CMMC, GDPR, program dashboard) with **manifest.json** SHA-256 file hashes. Console: **`/governance/compliance/workbook`** · API: **`GET /api/governance/compliance/workbook?periodDays=30`**. Audit event: `governance.assessor_workbook_exported`. Regression: `npm run test:assessor-workbook`.

**Scheduled compliance digest webhooks (migration #30):** weekly **HTTPS digest** of program readiness **deltas** vs the prior snapshot, SOC 2 trend changes, and newly overdue attestations for GRC tools. Console: **`/governance/compliance/digest`** · APIs: **`POST /api/governance/compliance/digest`**, scheduled **`POST /api/governance/compliance/digest/scheduled`** (Bearer `ZENTRO_DIGEST_CRON_SECRET`). Org column **`compliance_digest_webhook_url`**. Audit event: `governance.compliance_digest_delivered`. Regression: `npm run test:compliance-digest`.

**Compliance control SLA reminders (migration #31):** **Slack** and **Resend email** nudges when attestations are **due soon** (configurable days), **overdue**, or SOC 2 / ISO controls **regress** in the 30-day window. Console: **`/governance/compliance/sla-reminders`** · APIs: **`GET/POST /api/governance/compliance/sla-reminders`**, scheduled **`POST .../sla-reminders/scheduled`** (Bearer `ZENTRO_SLA_CRON_SECRET`). Env: `ZENTRO_SLACK_NOTIFY_COMPLIANCE_SLA`, `ZENTRO_RESEND_API_KEY`, `ZENTRO_EMAIL_FROM`. Audit: `governance.compliance_sla_reminders_sent`. Regression: `npm run test:compliance-sla-reminders`.

**FedRAMP POA&M export pack (no migration):** **Plan of Action and Milestones** CSV/JSON built from **continuous assessment exceptions** (SOC 2, ISO 27001, CMMC L2) mapped to **NIST SP 800-53 Rev 5** with risk ratings and milestone dates. Console: **`/governance/compliance/fedramp-poam`** · API: **`GET /api/governance/compliance/fedramp-poam?periodDays=30`**. Audit: `governance.fedramp_poam_exported`. Regression: `npm run test:fedramp-poam`.

**Control evidence freshness dashboard (no migration):** per-control **last audit / policy evidence** timestamps, **fresh / aging / stale** bands, and a **stale control queue** across the full catalog. Console: **`/governance/compliance/evidence-freshness`** · API: **`GET /api/governance/compliance/evidence-freshness?format=csv`**. Audit: `governance.evidence_freshness_exported`. Regression: `npm run test:evidence-freshness`.

**Multi-framework baseline comparison (no migration):** compares **live** readiness and **prior-period deltas** for all eight framework packs (SOC 2, ISO, PCI, HIPAA, NIST CSF, CIS v8, CMMC L2, GDPR Art. 32) from org-scoped `audit_log` and accepted policies — not mock data. Console: **`/governance/compliance/baseline-comparison`** · API: **`GET /api/governance/compliance/baseline-comparison?periodDays=30`**. Audit: `governance.baseline_comparison_exported`. Regression: `npm run test:baseline-comparison`.

**Obligation executive rollup PDF (no migration):** single **printable HTML** board packet combining **forecast timeline**, **crossover clusters**, **consolidation play status**, and **evidence request SLA** breaches — open in browser and **Print → Save as PDF**. Console: **`/governance/compliance/obligation-rollup`** · API: **`GET /api/governance/compliance/obligation-rollup?horizonDays=90&format=html`**. Audit: `governance.obligation_executive_rollup_exported`. Regression: `npm run test:obligation-executive-rollup`.

**Staffing action overdue reminders (migration #44):** **email** assignees and **admins** (for unassigned overdue actions) and **Slack** (`ZENTRO_SLACK_NOTIFY_STAFFING_OVERDUE`) when **accepted** or **in-progress** staffing actions remain open **past the forecast peak week** (deduped per action/channel). Console: **`/governance/compliance/staffing-action-reminders`** · APIs: **`GET/POST /api/governance/compliance/staffing-action-reminders`**, cron **`POST .../staffing-action-reminders/scheduled`** (Bearer `ZENTRO_STAFFING_OVERDUE_REMINDER_CRON_SECRET`). Audit: `governance.staffing_action_overdue_reminders_exported`, `governance.staffing_action_overdue_reminders_sent`. Regression: `npm run test:staffing-action-overdue-reminders`.

**Obligation staffing action tracker (migration #43):** **accept and track** load-balance transfers and capacity **what-if relief** scenarios (negative peak-week delta) from **accepted → in progress → completed**. Console: **`/governance/compliance/staffing-actions`** · API: **`GET /api/governance/compliance/staffing-actions?horizonDays=90`** (JSON, CSV, or **`format=html`** completion report). Audit: `governance.obligation_staffing_action_tracker_exported`, `governance.obligation_staffing_action_accepted`, `governance.obligation_staffing_action_updated`. Regression: `npm run test:obligation-staffing-action-tracker`.

**Committee peak-week staffing digest (migration #42):** **email**, **Slack** (`ZENTRO_SLACK_NOTIFY_PEAK_WEEK_STAFFING`), and optional **HTTPS webhook** when **capacity shortfall** and **load imbalance** coincide in the **same forecast peak week** (deduped per peak week). Console: **`/governance/compliance/peak-week-staffing-digest`** · APIs: **`GET/POST /api/governance/compliance/peak-week-staffing-digest`**, cron **`POST .../peak-week-staffing-digest/scheduled`** (Bearer `ZENTRO_PEAK_WEEK_STAFFING_DIGEST_CRON_SECRET`). Audit: `governance.peak_week_staffing_digest_exported`, `governance.peak_week_staffing_digest_delivered`. Regression: `npm run test:peak-week-staffing-digest`.

**Obligation owner load balancing (no migration):** assigns **forecast peak-week obligations** to **RACI primary accountables** per framework (from the ownership matrix) and generates **rebalance suggestions** when owner load is uneven. Console: **`/governance/compliance/obligation-load-balancing`** · API: **`GET /api/governance/compliance/obligation-load-balancing?horizonDays=90`**. Audit: `governance.obligation_owner_load_balancing_exported`. Regression: `npm run test:obligation-owner-load-balancing`.

**Committee obligation capacity budget (migration #41):** maps **live forecast weeks** to **estimated owner-hours** (obligations × configurable hours each) vs **available committee capacity** (capacity owners × hours per owner per week) and flags **shortfall weeks**. Capacity owners = max(owner/admin/reviewer/operator members, RACI accountable count). Console: **`/governance/compliance/committee-capacity-budget`** · API: **`GET /api/governance/compliance/committee-capacity-budget?horizonDays=90`**. Audit: `governance.committee_obligation_capacity_budget_exported`. Regression: `npm run test:committee-obligation-capacity-budget`.

**Board obligation what-if scenarios (no migration):** five curated **stress scenarios** (defer 2w/4w, descope PCI/HIPAA, descope GDPR/CMMC, defer + vendor slim) that recompute **live forecast density** vs baseline — peak week delta, current-week load, and **density alert breach** counts. Console: **`/governance/compliance/obligation-whatif`** · API: **`GET /api/governance/compliance/obligation-whatif?horizonDays=90`** (optional `shiftWeeks`, `excludeFrameworks`, `excludeVendor=1`). Audit: `governance.board_obligation_whatif_exported`. Regression: `npm run test:board-obligation-whatif`.

**Obligation density trend history (no migration):** **trailing-quarter** chart of **weekly obligations due** (by due week) plus **density alert delivery** counts from the alert log, with **forward forecast weeks** overlaid for capacity planning. Console: **`/governance/compliance/obligation-density-trend-history`** · API: **`GET /api/governance/compliance/obligation-density-trend-history?trailingDays=90`**. Audit: `governance.obligation_density_trend_history_exported`. Regression: `npm run test:obligation-density-trend-history`.

**Compliance obligation density alerting (migration #40):** configurable org thresholds on **live forecast density** — **current week**, **peak week**, and **overdue spike** — with **Slack** (`ZENTRO_SLACK_NOTIFY_OBLIGATION_DENSITY`) and **email** to owners/admins, deduped per breach key. Console: **`/governance/compliance/obligation-density-alerts`** · APIs: **`GET/POST /api/governance/compliance/obligation-density-alerts`**, cron **`POST .../obligation-density-alerts/scheduled`** (Bearer `ZENTRO_OBLIGATION_DENSITY_ALERT_CRON_SECRET`). Audit: `governance.obligation_density_alert_exported`, `governance.obligation_density_alerts_sent`. Regression: `npm run test:obligation-density-alerting`.

**Quarterly obligation committee digest (migration #39):** **90-day cadence** email (and optional **HTTPS webhook**) to **owners and admins** rolling up **forecast peak weeks**, **crossover reuse clusters**, and **evidence request SLA** breaches. Console: **`/governance/compliance/committee-digest`** · APIs: **`GET/POST /api/governance/compliance/committee-digest`**, cron **`POST .../committee-digest/scheduled`** (Bearer `ZENTRO_OBLIGATION_COMMITTEE_DIGEST_CRON_SECRET`). Audit: `governance.obligation_committee_digest_exported`, `governance.obligation_committee_digest_delivered`. Regression: `npm run test:quarterly-obligation-committee-digest`.

**Board obligation forecast timeline (no migration):** **forward-looking weekly obligation density** from live GRC calendar, testing schedules, and assessor requests — **peak week**, **committee summary**, and **milestone queue** for board/committee prep. Console: **`/governance/compliance/obligation-forecast`** · API: **`GET /api/governance/compliance/obligation-forecast?horizonDays=90`**. Audit: `governance.board_obligation_forecast_exported`. Regression: `npm run test:board-obligation-forecast`.

**Obligation consolidation playbook (migration #38):** **six-step operator workflows** per crossover cluster (confirm scope → evidence sprint → bundle → test linker → assessor requests → freshness), with **tracked play status** (`planned` / `in_progress` / `collected` / `verified`). Console: **`/governance/compliance/obligation-consolidation`** · API: **`GET /api/governance/compliance/obligation-consolidation?horizonDays=90`**. Audit: `governance.obligation_consolidation_playbook_exported`, `governance.obligation_consolidation_play_started`, `governance.obligation_consolidation_play_updated`. Regression: `npm run test:obligation-consolidation-playbook`.

**Multi-framework obligation crossover report (no migration):** clusters **open obligations** that share **catalog crosswalk / thematic control links** or **aligned due windows** (default 7 days) so one evidence pass can satisfy multiple framework packs; includes **framework pair rollup** and reuse notes. Console: **`/governance/compliance/obligation-crossover`** · API: **`GET /api/governance/compliance/obligation-crossover?horizonDays=90`**. Audit: `governance.obligation_crossover_report_exported`. Regression: `npm run test:obligation-crossover-report`.

**Regulatory obligation heatmap (no migration):** visual **concentration of open obligations** across **eight framework packs**, **vendor risk tiers**, and **control testing schedule kinds** from the GRC calendar, testing schedules, and assessor evidence requests (overdue / due ≤7d / upcoming). Console: **`/governance/compliance/obligation-heatmap`** · API: **`GET /api/governance/compliance/obligation-heatmap?horizonDays=90`**. Audit: `governance.regulatory_obligation_heatmap_exported`. Regression: `npm run test:regulatory-obligation-heatmap`.

**Control testing evidence linker (no migration):** links **automation dry-run** outputs to **catalog controls** (via accepted policy guardrails) and **evidence bundles** in the same collection window — appended to the **assessor workbook** ZIP as `testing/control-test-evidence-links.*`. Console: **`/governance/compliance/testing-evidence-linker`** · API: **`GET/POST /api/governance/compliance/testing-evidence-linker`**. Audit: `governance.control_testing_evidence_linker_exported`, `governance.control_testing_evidence_linked`. Regression: `npm run test:control-testing-evidence-linker`.

**Compliance evidence request SLA dashboard (migration #37):** fulfillment **SLAs** for assessor document requests — **overdue** and **at-risk** queues, assignee/framework rollups, **on-time %**, and **auditor digest** (email to auditor-role members + optional webhook). Console: **`/governance/compliance/evidence-request-sla`** · APIs: **`GET/POST /api/governance/compliance/evidence-request-sla`**, cron **`POST .../evidence-request-sla/scheduled`** (Bearer `ZENTRO_EVIDENCE_REQUEST_SLA_CRON_SECRET`). Audit: `governance.evidence_request_sla_dashboard_exported`, `governance.evidence_request_sla_digest_delivered`. Regression: `npm run test:evidence-request-sla-dashboard`.

**Compliance attestation renewal calendar (migration #36):** **renewal waves** (14-day lead windows) for control attestations due within a configurable **horizon** (default 90d), **per-framework** rollup, and **owner email nudges** with weekly dedup. Console: **`/governance/compliance/attestation-renewal`** · APIs: **`GET/POST /api/governance/compliance/attestation-renewal`**, cron **`POST .../attestation-renewal/scheduled`** (Bearer `ZENTRO_ATTESTATION_RENEWAL_CRON_SECRET`). Audit: `governance.attestation_renewal_calendar_exported`, `governance.attestation_renewal_nudges_sent`. Regression: `npm run test:attestation-renewal-calendar`.

**Compliance committee meeting pack (no migration):** quarterly **ZIP** with **printable HTML** (`committee-pack-summary.html` → save as PDF), **health scorecard**, **posture**, **exception register**, and **open gaps** + tamper-evident manifest. Console: **`/governance/compliance/committee-meeting-pack`** · API: **`GET /api/governance/compliance/committee-meeting-pack?periodDays=30`**. Audit: `governance.compliance_committee_meeting_pack_exported`. Regression: `npm run test:compliance-committee-meeting-pack`.

**Compliance control health scorecard (no migration):** leadership **0–100 health score** blending **unified posture (45%)**, **vendor inherited-control health (30%)**, and **gap remediation closure (25%)**, with RAG metrics and board actions. Console: **`/governance/compliance/control-health-scorecard`** · API: **`GET /api/governance/compliance/control-health-scorecard?periodDays=30`**. Audit: `governance.compliance_control_health_scorecard_exported`. Regression: `npm run test:compliance-control-health-scorecard`.

**Inherited control coverage gap report (no migration):** identifies **third-party vendors** whose **inherited** catalog controls lack **linked audit evidence** or **attestation sign-off** vs their register **risk tier** (critical/high require attestation). Console: **`/governance/compliance/inherited-control-gaps`** · API: **`GET /api/governance/compliance/inherited-control-gaps?periodDays=30`**. Audit: `governance.inherited_control_coverage_gaps_exported`. Regression: `npm run test:inherited-control-coverage-gaps`.

**Regulatory mapping change digest (migration #35):** detects changes to the **compliance catalog**, **SOC 2 ↔ ISO crosswalk**, and **regulatory scenario catalog** vs the last org snapshot; delivers **HTTPS webhook** and optional **email** to owners/admins. Console: **`/governance/compliance/mapping-digest`** · APIs: **`GET/POST /api/governance/compliance/mapping-digest`**, scheduled **`POST .../mapping-digest/scheduled`** (Bearer `ZENTRO_MAPPING_DIGEST_CRON_SECRET`). Audit: `governance.regulatory_mapping_digest_delivered`. Regression: `npm run test:regulatory-mapping-change-digest`.

**Compliance obligation ICS export (no migration):** downloadable **iCalendar (.ics)** feed of **attestation due dates**, **vendor reviews**, **recommended evidence bundles**, **framework checkpoints**, **control testing schedules**, and **open assessor evidence requests** from live org data. Console: **`/governance/compliance/obligation-ics`** · API: **`GET /api/governance/compliance/obligation-ics?horizonDays=365`** · Assessor API: **`obligation-ics`** resource. Audit: `governance.compliance_obligation_ics_exported`. Regression: `npm run test:compliance-obligation-ics`.

**Assessor evidence request workflow (migration #34):** auditors and admins **open document requests** tied to **catalog controls** with **due dates**, optional **assignee**, and **fulfillment** notes; operators mark fulfilled and link to audit evidence. Console: **`/governance/compliance/evidence-requests`** · API: **`GET /api/governance/compliance/evidence-requests`**. Audit: `governance.assessor_evidence_request_created`, `governance.assessor_evidence_request_fulfilled`, `governance.assessor_evidence_request_cancelled`, `governance.assessor_evidence_requests_exported`. Regression: `npm run test:assessor-evidence-requests`.

**Compliance exception register (no migration):** centralized register of **control assessment gaps**, **policy drift findings**, and **compensating gap remediations** with **expiry**, **approver** (attestation owner or remediation resolver), and **framework linkage**. Console: **`/governance/compliance/exception-register`** · API: **`GET /api/governance/compliance/exception-register?periodDays=30`**. Audit: `governance.compliance_exception_register_exported`. Regression: `npm run test:compliance-exception-register`.

**GRC control ownership matrix (no migration):** RACI-style **accountable / responsible / consulted / informed** rows per catalog control from **live attestations**, **scope boundary** systems and data flows, and **org membership**. Console: **`/governance/compliance/control-ownership`** · API: **`GET /api/governance/compliance/control-ownership`**. Audit: `governance.control_ownership_matrix_exported`. Regression: `npm run test:control-ownership-matrix`.

**Unified compliance posture score (no migration):** single **0–100 org-wide GRC score** (grade A–F) blending **framework readiness** (40%), **attestation closure** (20%), **vendor readiness** (15%), **gap remediation** (10%), and **risk mitigation** (15%) from live program, baseline, vendor, and risk data. Console: **`/governance/compliance/posture-score`** · API: **`GET /api/governance/compliance/posture-score?periodDays=30`**. Audit: `governance.compliance_posture_score_exported`. Regression: `npm run test:compliance-posture-score`.

**Compliance KPI trend dashboards (no migration):** weekly **gap remediation velocity** and **attestation closure** from live `audit_log`, remediation records, and attestation events; **per-framework readiness** trends from measured period-over-period baselines (interpolated weekly between prior and current). Console: **`/governance/compliance/kpi-trends`** · API: **`GET /api/governance/compliance/kpi-trends?periodDays=90`**. Audit: `governance.compliance_kpi_trends_exported`. Regression: `npm run test:compliance-kpi-trends`.

**Compliance scope boundary mapper (no migration):** maps **in-scope systems** (services, unmapped vulnerability assets, vendors) and **dependency data flows** to **framework control packs** for audit boundary documentation. Uses org `data_boundary`, live **services** graph, and **third-party vendor** inheritance. Console: **`/governance/compliance/scope-boundary`** · API: **`GET /api/governance/compliance/scope-boundary`**. Audit: `governance.scope_boundary_exported`. Regression: `npm run test:scope-boundary-mapper`.

**Automated control testing schedules (no migration):** recurring **evidence collection windows** from live **attestation due dates** (14d lead), **quarterly framework checkpoints**, **stale-control retests** (7d cadence), and **30d evidence bundle** cadence. Console: **`/governance/compliance/testing-schedules`** · API: **`GET /api/governance/compliance/testing-schedules?horizonDays=90`**. Audit: `governance.control_testing_schedules_exported`. Regression: `npm run test:control-testing-schedules`.

**Compliance evidence lineage (no migration):** traces **audit_log** and **accepted policies** through **control mapping**, **tamper-evident evidence bundles**, and **assessor workbook** exports using live org data. Console: **`/governance/compliance/evidence-lineage`** · API: **`GET /api/governance/compliance/evidence-lineage?periodDays=30`**. Audit: `governance.evidence_lineage_exported`. Regression: `npm run test:evidence-lineage`.

**Regulatory change impact simulator (no migration):** models how **curated regulatory updates** (EU DORA, PCI DSS v4 logging, HIPAA, GDPR Art. 32, CMMC) shift **live control coverage** and projected readiness per framework. Console: **`/governance/compliance/regulatory-impact`** · API: **`GET /api/governance/compliance/regulatory-impact?periodDays=30`**. Audit: `governance.regulatory_impact_exported`. Regression: `npm run test:regulatory-change-impact`.

**Cross-framework control dependency graph (no migration):** visualizes **shared evidence paths** across framework packs — **SOC 2↔ISO crosswalk** links, **thematic bridges**, **co-occurring audit events**, and **accepted policies** mapping to multiple controls. Console: **`/governance/compliance/control-graph`** · API: **`GET /api/governance/compliance/control-graph?periodDays=30`**. Audit: `governance.control_graph_exported`. Regression: `npm run test:control-dependency-graph`.

**Compliance policy drift detection (no migration):** highlights **accepted automation policies** whose **guardrails diverge** from **live continuous assessment gaps** (missing dry-run / change-window / blast-radius, uncovered gaps, stale acceptance). Console: **`/governance/compliance/policy-drift`** · API: **`GET /api/governance/compliance/policy-drift?periodDays=30`**. Audit: `governance.policy_drift_exported`. Regression: `npm run test:policy-drift`.

**Continuous control benchmarking (no migration):** compares **live org readiness** (from `audit_log` + policies) to **anonymized industry percentile bands** (p25–p90) per framework when reference benchmarks are available. Console: **`/governance/compliance/benchmarking`** · API: **`GET /api/governance/compliance/benchmarking?periodDays=30`**. Audit: `governance.control_benchmark_exported`. Regression: `npm run test:control-benchmark`.

**Compliance calendar & audit season planner (no migration):** month-grid **GRC calendar** from live **attestation due dates**, **vendor review** dates, **evidence bundle** history (+ recommended next snapshot), **quarter-end framework checkpoints**, and **digest/SLA** cadence when configured. Console: **`/governance/compliance/calendar`** · API: **`GET /api/governance/compliance/calendar?horizonDays=90`**. Audit: `governance.grc_calendar_exported`. Regression: `npm run test:grc-calendar`.

**Board-ready GRC executive summary (no migration):** printable **one-page leadership rollup** from live **program dashboard**, **risk heatmap**, and **attestation** posture with recommended board actions. Console: **`/governance/compliance/executive-summary`** (print button + exports) · API: **`GET /api/governance/compliance/executive-summary?periodDays=30`** (`format=json|markdown|html|csv`). Assessor API resource **`executive-summary`**. Audit: `governance.grc_executive_summary_exported`. Regression: `npm run test:grc-executive-summary`.

**Compliance risk heatmap (no migration):** visualizes **framework** and **third-party vendor** risk concentration from live **baseline comparison**, **program dashboard**, and **vendor register** data (composite 0–100 scores, tier × category matrix, top hotspots). Console: **`/governance/compliance/risk-heatmap`** · API: **`GET /api/governance/compliance/risk-heatmap?periodDays=30`**. Assessor API resource **`risk-heatmap`**. Audit: `governance.compliance_risk_heatmap_exported`. Regression: `npm run test:compliance-risk-heatmap`.

**Compliance automation runbooks (migration #33):** link **live assessment gaps** from the program dashboard to **in-repo runbooks** and **automation playbooks**, then track **open / in progress / resolved** closure per org. Console: **`/governance/compliance/runbooks`** · API: **`GET /api/governance/compliance/gap-remediations?periodDays=30`**. Program dashboard includes **gap remediation** counts. Audit: `governance.compliance_gap_remediation_started`, `governance.compliance_gap_remediation_resolved`. Regression: `npm run test:compliance-gap-runbooks`.

**Assessor-scoped compliance API tokens (migration #32):** org-level **`zentro_ca_*`** read-only keys for external auditors. Issue tokens at **`/governance/compliance/assessor-api`** · call **`GET /api/governance/compliance/assessor/{resource}`** (e.g. `evidence-export`, `workbook`, `crosswalk`, `baseline-comparison`, framework JSON reports) with `Authorization: Bearer <token>`. Uses the same live export builders as the console (org `audit_log` + policies). Requires **`SUPABASE_SERVICE_ROLE_KEY`** on the server. Audit: `governance.assessor_api_token_created`, `governance.assessor_api_accessed`. Regression: `npm run test:assessor-api`.

### Optional webhook signature verification (recommended)

To require HMAC verification on `/api/integrations/alerts`, set:

- `ZENTRO_ALERT_WEBHOOK_SIGNING_SECRET`

When set, requests must include:

- `X-Zentro-Signature: <hex>` or `sha256=<hex>`
- Optional: `X-Zentro-Signature-Timestamp` (if provided, verifier checks `${timestamp}.${rawBody}`)

Digest algorithm: **HMAC-SHA256** over raw request body (or timestamp + body mode above).

Local signature helper:

```bash
# Inline payload
npm run gen:alert-signature -- --secret "your-secret" --body '{"title":"Test alert"}'

# Payload from file + timestamp mode
npm run gen:alert-signature -- --secret "your-secret" --body-file payload.json --timestamp 1715000000
```

## Stack

Next.js 16, React 19, Tailwind CSS 4.

## Security policy

For operational metadata exposure rules and required hardening headers, see `SECURITY.md`.

### Security model (quick view)

- Guardrails are enforced at runtime for automation execution (not UI-only checks).
- High-risk execution gates require dry-run freshness, change-window compliance, and blast-radius scope adherence when policy rows require them.
- Guardrail blocks are audited with both human-readable reasons and normalized reason codes to support governance trending.
- Operational endpoints use no-store + noindex + browser hardening response headers.
