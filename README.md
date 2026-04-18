# Shynvo Platform (web)

Next.js app for [shynvo.app](https://shynvo.app): marketing site + console shell.

**Roadmap & completion checklist:** [`docs/PLATFORM_PLAN.md`](docs/PLATFORM_PLAN.md) · **Database (Supabase):** run [`supabase/migrations/20260418120000_platform_spine.sql`](supabase/migrations/20260418120000_platform_spine.sql) in the SQL Editor after creating the project.

## Run locally (preview UI)

```bash
npm install
npm run dev
```

Open **http://localhost:3000** (marketing) and **http://localhost:3000/copilot** (console).

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

### Supabase (auth)

The app uses **email + password** via **`@supabase/ssr`**. Routes: **`/auth/sign-up`** (Get started), **`/auth/sign-in`**, **`/auth/callback`** (email confirmation), **`POST /auth/sign-out`**.

**Variables** (Railway + `.env.local`): **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**. Optional server-only **`SUPABASE_SERVICE_ROLE_KEY`** for admin tasks (never expose to the client).

**Supabase dashboard → Authentication → URL configuration**

- **Site URL:** your production origin (e.g. `https://shynvo.app`).
- **Redirect URLs:** include `https://shynvo.app/auth/callback` and `http://localhost:3000/auth/callback` for local dev.

When both public Supabase vars are set, **middleware** requires a session for **`/copilot`**, **`/incidents`**, **`/automations`**, **`/approvals`**, **`/audit`**, and **`/settings/**`**. If the vars are **omitted**, the console stays open without login (useful for local UI work).

**Next for billing:** map Lemon Squeezy / webhooks to the signed-in user (e.g. store `user.id` or email in your billing metadata), then gate features by tier in middleware or Server Components. **Still recommended:** add session or service checks on **`/api/reasoning`** and **`/api/robot`** before production so they are not open relays.

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

Query string, method, and body are forwarded. Headers forwarded: **`Content-Type`**, **`Accept`**, **`Authorization`** (add a session/JWT check on these routes before production if the upstream is sensitive).

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
