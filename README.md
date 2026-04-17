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

## Stack

Next.js 16, React 19, Tailwind CSS 4.
