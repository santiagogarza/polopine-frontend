# Polopine Frontend

Vite + React polling UI for **[Polopine](https://github.com/santiagogarza/polopine-backend)** — a two-repo demo built by **Santi Garza** to show **multi-repo support for Cursor cloud agents**.

The API lives in a separate repository with no shared imports: types are duplicated on purpose so cloud agents can work in one repo without touching the other.

| Repo | Role |
|------|------|
| [polopine-backend](https://github.com/santiagogarza/polopine-backend) | Express API (deploy on Render or similar) |
| **This repo** | SPA on Vercel |

## Quick start (local)

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`. Run the [backend](https://github.com/santiagogarza/polopine-backend) on port `8080` (or set `VITE_API_URL`).

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | Backend origin (no trailing slash) |
| `VITE_PUBLIC_URL` | `window.location.origin` | Public URL the Home page QR code points to (no trailing slash). Set to your Vercel production URL so local dev QR codes still open the live app. |

Restart the dev server after changing `.env`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port **3000** |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm test` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |

## Routes

| Path | Page |
|------|------|
| `/` | Home — create CTA, join QR, recent polls (voted polls show live mini-results) |
| `/create` | Create poll |
| `/poll/:id` | Vote (redirects to results if already voted) |
| `/poll/:id/results` | Live results (vote required; polls every 2s) |

## Deploy on Vercel (production)

1. Push this repo to [github.com/santiagogarza/polopine-frontend](https://github.com/santiagogarza/polopine-frontend).
2. [Vercel](https://vercel.com) → **Add New Project** → import the repo (framework: **Vite**).
3. **Environment variables** (Production + Preview):

   | Name | Value |
   |------|--------|
   | `VITE_API_URL` | Your deployed backend URL, e.g. `https://polopine-api.onrender.com` |
   | `VITE_PUBLIC_URL` | Your Vercel frontend URL, e.g. `https://polopine.vercel.app` (optional on Vercel; required locally if you want the QR to point at production) |

4. Deploy. [`vercel.json`](vercel.json) rewrites all routes to `index.html` for React Router.

Deploy the API first using the [backend README](https://github.com/santiagogarza/polopine-backend#deploy-production), then set `VITE_API_URL` and redeploy the frontend if needed. Set `VITE_PUBLIC_URL` to the same Vercel URL in Production and Preview so the join QR always targets the live app.

## Publish to GitHub

```bash
git remote add origin https://github.com/santiagogarza/polopine-frontend.git
git push -u origin main
```

## Governance

Cursor hook blocks destructive shell commands. See [`.cursor/hooks.json`](.cursor/hooks.json) and [`.cursor/hooks/block-destructive.sh`](.cursor/hooks/block-destructive.sh).
