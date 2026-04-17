# Shynvo Platform (web)

Next.js app for [shynvo.app](https://shynvo.app): marketing site + console shell.

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
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | Lemon product checkout link (CTAs use this when set). |
| `LEMONSQUEEZY_WEBHOOK_SIGNING_SECRET` | Lemon webhook signing secret. |

Webhook URL in Lemon: `https://shynvo.app/api/webhooks/lemonsqueezy` (use your production domain).

## Railway (deploy now)

Repo: **`Sanher50/SHYNVO`**, branch **`main`**. This project ships **`railway.json`**: Railpack runs **`npm run build`**, start **`npm run start`**, healthcheck **`/`**.

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
| `SHYNVO_ROBOT_API_URL` | Your robot API base URL (**server only**). Used on **Settings → Connectors** for health checks. |

`PORT`: Railway may inject this automatically. **Next.js listens on `PORT`** (see `next start --help`: default port 3000, env `PORT`).

### Target port (Generate Domain / Custom Domain)

The **Target port** in the Railway UI must be the **same port your app binds to** — not a random default like **8080** unless your service really listens there.

1. Open **Variables** and check **`PORT`**.  
2. If it’s missing or you want a fixed value, add **`PORT`** = **`3000`**.  
3. When you **Generate Domain** or **Add Custom Domain** for `shynvo.app`, set **Target port** to **`3000`** (same as `PORT`).

If target port ≠ listen port, you’ll get **502 / connection refused** even when the deploy is “green”.

### 3. Public URL

**Networking** → **Generate Domain** (or use your `*.up.railway.app` URL). Open it — you should see the marketing home page.

### 4. Custom domain `shynvo.app`

**Networking** → **Custom Domain** → add **`shynvo.app`** (and **`www.shynvo.app`** if you use it).  
Set **Target port** to **`3000`** (or whatever **`PORT`** you use in Variables).  
At your DNS provider, add the **CNAME / ALIAS** records Railway shows.  
The app’s **middleware** redirects `www` → apex.

### 5. Lemon webhooks

After `shynvo.app` resolves to Railway, set the Lemon webhook URL to:

`https://shynvo.app/api/webhooks/lemonsqueezy`

### Troubleshooting

**“Connected branch does not exist”** — GitHub must have a **`main`** branch with at least one commit (push from the GitHub section above).

**Build fails** — open the deploy **Build logs**; common fixes: wrong **Root Directory**, or Node version (this app expects **Node ≥ 20**; Railway/Railpack usually picks 20+ automatically).

**“Application failed to respond”** — the container is not accepting HTTP on the port Railway expects.

1. **Variables:** set **`PORT=3000`** and set the custom domain **Target port** to **`3000`**.
2. **Deploy logs:** open **Deployments** → latest → **Deploy logs** (and **Build logs**) for stack traces or exit codes.
3. This repo uses **`npm run start`** → `next start -H 0.0.0.0` so the server listens on **all interfaces** inside the container.
4. Healthcheck hits **`/api/health`** (lightweight JSON). If that route returns 200 but `/` fails, check page-specific errors in logs.

## Connecting backends to the frontend

Browsers should **not** call your `*.up.railway.app` APIs directly (CORS, and you keep base URLs off the client). Use **same-origin** routes on this app; Next forwards to your backends using env vars.

### Railway Variables (server only)

- `SHYNVO_REASONING_API_URL` — base URL, no trailing slash (e.g. `https://your-api.up.railway.app`).
- `SHYNVO_ROBOT_API_URL` — same for the robot service.

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

// POST example — path must match your backend route
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
| **`GET /api/backend/status`** | JSON snapshot of both backends (health probe). |
| **`/settings/connectors`** | UI for the same probes. |
| **`/copilot`** | Shows backend status from the server. |

## Stack

Next.js 16, React 19, Tailwind CSS 4.
