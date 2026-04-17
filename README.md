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

## Railway

This repo includes **`railway.json`** (Railpack: `npm run build`, start `npm run start`, healthcheck `/`).

### “Connected branch does not exist”

Railway is waiting for a **`main`** branch on GitHub that actually has commits.

1. Push this project to **`main`** (see GitHub section above). An **empty** GitHub repo has no `main` yet until the first push.
2. In Railway → service → **Settings → Source**, confirm **Branch** = `main` (or change it to whatever branch you use, e.g. `master`, and push that branch).

### Root directory

- If the GitHub repo root **is** this Next app (you pushed the contents of `web/`), leave **Root Directory** **empty**.
- If the repo is a monorepo (e.g. `web/` inside the repo), set **Root Directory** to **`web`**.

### Environment variables (Railway dashboard)

Set at least: `NODE_ENV=production` (often set automatically), Lemon vars from `.env.example`, and optionally `NEXT_PUBLIC_SITE_URL=https://shynvo.app` for correct absolute URLs in previews.

## Stack

Next.js 16, React 19, Tailwind CSS 4.
