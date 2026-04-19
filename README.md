# Shynvo Platform (web)

Next.js app for [shynvo.app](https://shynvo.app): marketing site + console shell.

**Roadmap & completion checklist:** [`docs/PLATFORM_PLAN.md`](docs/PLATFORM_PLAN.md) · **Vision & long-term direction:** [`docs/VISION_AND_ROADMAP.md`](docs/VISION_AND_ROADMAP.md) (also **`/vision`** in the signed-in console). **Database (Supabase):** run SQL migrations **in order** in the Supabase SQL editor (same filenames under [`supabase/migrations/`](supabase/migrations/)): `platform_spine` → `incidents` → `console_extensions` → `api_keys` → `automation_dry_runs` → `automation_dry_runs_incident_id` → `services_alert_ingest` (see files for exact timestamps).

## Run locally (preview UI)

```bash
npm install
npm run dev
```

Open **http://localhost:3000** (marketing) and **http://localhost:3000/hub** (console hub — works without Supabase; Copilot uses `/api/copilot/chat` with offline or OpenAI).

## GitHub: `SHYNVO`

1. On GitHub, create a new repo named **SHYNVO** (empty — no README/License if you want zero merge friction).
2. From the folder that contains this project:

**Option A — this `web` folder is the repo root** (simplest for Railway):

```bash
cd web
git init
git add .
git commit -m "Initial Shynvo web app"
git branch -M main
git remote add origin https://github.com/Sanher50/SHYNVO.git
git push -u origin main
```

If GitHub shows an error because the remote already has a commit (e.g. you used GitHub’s “add README” wizard), run once before `git push`:

```bash
git pull origin main --allow-unrelated-histories
```

Resolve any merge (keep this project’s `README.md` if asked), then `git push -u origin main`.

**Windows:** install [Git for Windows](https://git-scm.com/download/win) or use **GitHub Desktop** → add the `web` folder → publish to `Sanher50/SHYNVO`.

**Option B — monorepo** (e.g. `SHYNVO/web`):

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

Webhook URL in Lemon: `https://shynvo.app/api/webhooks/lemonsqueezy` (use your production domain).

**Checkout → user link:** paid flows should use `getCheckoutUrlForUser(userId)` from `lib/billing.ts` so Lemon sends `meta.custom_data.shynvo_user_id` and webhooks can attach rows in `public.subscriptions`.

## Railway (deploy now)

Repo: **`Sanher50/SHYNVO`**, branch **`main`**. This project ships **`railway.json`**: Railpack runs **`npm run build`**, start **`npm run start`**, healthcheck **`/api/health`** (see `app/api/health/route.ts`).

**Deploy-first (smoke test before building more):**

1. Push **`web/`** as the repo root (or set **Root Directory** to `web` in Railway).
2. In **Supabase**, run all migrations in order (see top of this README) so auth, incidents, billing, services, and ingest tables exist.
3. In **Railway → Variables**, set at least **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**, **`SUPABASE_SERVICE_ROLE_KEY`**, and **`NEXT_PUBLIC_SITE_URL`** (your Railway URL or custom domain). Add **`OPENAI_API_KEY`** only if you want cloud Copilot in prod.
4. In **Supabase → Authentication → URL configuration**, set **Site URL** and **Redirect URLs** to your production origin and `/auth/callback`.
5. Deploy, then verify **`GET /api/health`** (200) and sign in → **`/hub`**. Fix **Target port** vs **`Network: 0.0.0.0:PORT`** in logs if you see 502 (see below).

### 1. Service → Source

1. Open your Railway project → the **web** service (or create a service from **Empty** then attach GitHub).
2. **Settings** → **Source** → **Connect Repo** → pick **`Sanher50/SHYNVO`**.
3. **Branch**: **`main`**.
4. **Root Directory**: leave **empty** (repo root is the Next app). Only set **`web`** if your GitHub layout is `SHYNVO/web/...`.

Save. Railway should start a deploy within a minute.

### 2. Variables (service → Variables)

Add anything you use in production (same names as `.env.example`):

| Name | Notes |
|------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://shynvo.app` (optional; helps metadata when not using the default). |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | Your Lemon checkout link. |
| `LEMONSQUEEZY_WEBHOOK_SIGNING_SECRET` | Webhook signing secret (server only). |
| `SHYNVO_REASONING_API_URL` | Your reasoning API base URL (**server only**; set in Railway, not `NEXT_PUBLIC_`). |
| `SHYNVO_ROBOT_API_URL` | Your automation service base URL (**server only**). Used on **Settings → Connectors** for health checks. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (see **Supabase (auth)** below). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (set with URL above). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (**server only**); required for `/api/webhooks/lemonsqueezy` to write subscriptions. |

`PORT`: Railway often injects **`PORT` automatically** (commonly **`8080`** on new services). **Next.js always listens on whatever `PORT` is set to** — check your **Deploy logs** for the line `Network: http://0.0.0.0:XXXX`; that **`XXXX` is the only port** your public domain’s **Target port** must use (unless you override `PORT`).

### Target port (Generate Domain / Custom Domain)

The **Target port** in the Railway UI must match **the port in your start logs** (e.g. `Network: http://0.0.0.0:8080` → target **8080**). Guessing **3000** when the app is on **8080** causes **502 / “Application failed to respond”**.

1. Open **Deploy logs** and note the port after `0.0.0.0:` (often **8080** on Railway).
2. **Networking** → your domain → **Target port** = that same number.
3. **Optional:** in **Variables**, set **`PORT`** = **`3000`** if you prefer; then set **Target port** to **`3000`** and redeploy so logs show `0.0.0.0:3000`.

If target port ≠ listen port, you’ll get **502 / connection refused** even when the deploy is “green”.

### 3. Public URL

**Networking** → **Generate Domain** (or use your `*.up.railway.app` URL). Open it — you should see the marketing home page.

### 4. Custom domain `shynvo.app`

**Networking** → **Custom Domain** → add **`shynvo.app`** (and **`www.shynvo.app`** if you use it).  
Set **Target port** to the same value as **`PORT`** / the **`Network: … 0.0.0.0:PORT`** line in deploy logs (often **8080** unless you set **`PORT=3000`**).  
At your DNS provider, add the **CNAME / ALIAS** records Railway shows.  
The app’s **middleware** redirects `www` → apex.

### 5. Lemon webhooks

After `shynvo.app` resolves to Railway, set the Lemon webhook URL to:

`https://shynvo.app/api/webhooks/lemonsqueezy`

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
2. **Settings → Source**: confirm **Branch** is **`main`** and the repo is **`Sanher50/SHYNVO`**. Use **Disconnect** / **Reconnect** if pushes never trigger a deploy.
3. **Redeploy**: on the latest deployment menu, choose **Redeploy** (or **Restart** only restarts the same image — you want a **new build** when code changed). If Railway offers **Clear build cache**, use it once.
4. **One-shot cache bust**: add variable **`NIXPACKS_NO_CACHE`** = **`1`**, redeploy, then **remove** the variable (optional; forces Nixpacks to rebuild layers).
5. **Prove which revision is live**: `curl -sS "https://YOUR-URL.up.railway.app/api/health"` — check **`commit`** (git SHA) and **`railway_deployment_id`**. After a fresh deploy, **`uptime_s`** resets to a small number.
6. **Browser**: hard refresh (**Ctrl+Shift+R**) or a private window — stale JS/CSS can look like an old release even when the server is new.

### Supabase (auth)

The app uses **email + password** via **`@supabase/ssr`**. Routes: **`/auth/sign-up`**, **`/auth/sign-in`**, **`/auth/callback`** (email confirmation), **`POST /auth/sign-out`**.

**Variables** (Railway + `.env.local`): **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**. Optional server-only **`SUPABASE_SERVICE_ROLE_KEY`** for admin tasks (never expose to the client).

**Supabase dashboard → Authentication → URL configuration**

- **Site URL:** your production origin (e.g. `https://shynvo.app`).
- **Redirect URLs:** include `https://shynvo.app/auth/callback` and `http://localhost:3000/auth/callback` for local dev.

When both public Supabase vars are set, **middleware** requires a session for **`/hub`**, **`/overview`**, **`/copilot`**, **`/incidents`**, **`/services`**, **`/automations`**, **`/runbooks`**, **`/approvals`**, **`/audit`**, and **`/settings/**`**. If the vars are **omitted**, the console stays open without login (useful for local UI work).

**Next for billing:** map Lemon Squeezy / webhooks to the signed-in user (e.g. store `user.id` or email in your billing metadata). **Still recommended:** session or API-key checks on **`/api/reasoning`** and **`/api/robot`** when auth env is set (already implemented).

## Connecting external services to the app

Browsers should **not** call your `*.up.railway.app` URLs directly (CORS, and you keep service URLs off the client). Use **same-origin** routes on this app; Next forwards to your configured services using env vars.

### Railway Variables (server only)

- `SHYNVO_REASONING_API_URL` — base URL, no trailing slash (e.g. `https://your-api.up.railway.app`).
- `SHYNVO_ROBOT_API_URL` — same for the automation service.

### Reverse proxy routes (send any path)

| Your frontend calls | Upstream request |
|---------------------|------------------|
| `GET /api/reasoning/health` | `GET {SHYNVO_REASONING_API_URL}/health` |
| `POST /api/reasoning/v1/chat` | `POST {SHYNVO_REASONING_API_URL}/v1/chat` |
| `GET /api/robot/docs` | `GET {SHYNVO_ROBOT_API_URL}/docs` |
| `GET /api/robot/health` | `GET {SHYNVO_ROBOT_API_URL}/health` |

Query string, method, and body are forwarded. Headers forwarded: **`Content-Type`**, **`Accept`**, and **`Authorization`** only when it is **not** a Shynvo API key (`shynvo_sk_…`), so your upstream never receives Shynvo credentials.

When Supabase auth env vars are set, callers must use a **browser session** or an **API key** from **Settings → API keys** (`Authorization: Bearer <key>` or `X-Shynvo-Api-Key`). Resolving keys by hash uses **`SUPABASE_SERVICE_ROLE_KEY`** on the server.

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
| **`/settings/billing`** | Plan, Lemon checkout with `shynvo_user_id`, subscription snapshot. |
| **`/settings/connectors`** | UI for the same probes. |
| **`/copilot`** | Shows connection status from the server. |

## Stack

Next.js 16, React 19, Tailwind CSS 4.
