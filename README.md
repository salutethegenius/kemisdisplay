# KemisDisplay

Browser-based digital signage: **Next.js 14** (Vercel → [kemisdisplay.com](https://kemisdisplay.com)) + **FastAPI** (Railway) + **PostgreSQL**.

## Prerequisites

- Docker (for Postgres)
- Python 3.11+ recommended (3.14 works with pinned `sqlalchemy>=2.0.40`). For **menu video rendering**, use **Python 3.12** if `pip install playwright` fails on your Python version (Playwright depends on `greenlet` wheels).
- Node 18+
- **Enough free disk space** for `npm install` (corrupted `node_modules` / SWC usually means the disk was full)

## Local development

### Database

```bash
docker compose up -d
```

Postgres listens on **localhost:5434** (mapped from container 5432).

If you see `connection refused` on 5434 or signup/login returns **503**, Postgres is not running. If `docker compose` fails with `unexpected end of JSON input` when pulling the image, try `docker pull postgres:16-alpine` then `docker compose up -d` again (Docker Desktop restart often fixes corrupt cache).

`GET /health` reports `"database": "ok"` or `"database": "unavailable"` so you can see the backend logs without digging into tracebacks.

### API

```bash
cd api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # edit DATABASE_URL, JWT_SECRET, CORS_ORIGINS, etc.
uvicorn app.main:app --reload --port 8000
```

On first startup, tables are created automatically (`create_all`). After pulling updates, apply migrations from `api/`:

- If you **already** have tables from `create_all` but Alembic has never run: `alembic stamp 0001` then `alembic upgrade head`.
- **Do not** `alembic stamp 0001` if you are already at revision `0002` — that downgrades Alembic’s bookkeeping and replaying `0002` can fail. If `is_admin` already exists and Alembic is confused, run `alembic stamp 0002` to sync.
- Otherwise: `alembic upgrade head`.

(`create_all` does not add new columns to existing PostgreSQL tables; migrations do.)

### Admin dashboard

- Set `ADMIN_EMAILS=you@domain.com` in the API `.env` (comma-separated for several), restart the API: matching existing users get `is_admin=true`.
- Or promote manually: `UPDATE users SET is_admin = true WHERE email = 'you@domain.com';`
- In the web app, admins see **Admin** in the sidebar → `/dashboard/admin` to list/edit/delete users (cannot delete yourself or strip your own admin flag).
- API routes: `GET/PATCH/DELETE /admin/users`, `GET /admin/users/{id}` (Bearer token, admin only).

- `DEV_BYPASS_BILLING=1` — skip trial/plan limits (local dev only).
- `PUBLIC_API_BASE_URL` — must match where the API is reachable (used in uploaded file URLs for the display player).

### Web

```bash
cd web
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

`npm run dev` uses **Turbopack** (`next dev --turbo`) to avoid flaky webpack dev chunks (`Cannot find module './NNN.js'`). If the app still misbehaves after many edits, run **`npm run dev:clean`** (deletes `.next` then starts dev). Use **`npm run dev:webpack`** only if you need the classic webpack dev server.

Open [http://localhost:3000](http://localhost:3000). Sign up, create a screen, upload media, build a playlist, then open the display URL on a TV browser.

The dashboard is **mobile-first**: bottom navigation on small screens, sidebar from `md` up, and card layouts for media and admin where tables would be cramped.

**Menus** (`/dashboard/menus`): build a chalkboard-style specials board, save, then **Generate 30s video**. The API returns `202` with a `job_id`; the UI polls `GET /jobs/{job_id}`. When the job succeeds, a new **Media** row appears (H.264 MP4). Add it to a screen playlist like any other upload.

Optional on the API host for menu renders: **ffmpeg** on `PATH`, and **Playwright** + Chromium (`pip install playwright` then `playwright install chromium`). Without them, jobs fail with a clear error. Set `MENU_RENDER_TMP` if you want renders outside the default temp dir (see `api/.env.example`).

### Flat routing

`/dashboard/screens/...` and similar paths use a **middleware rewrite** to `/dashboard` so the `app/` tree stays shallow; `DashboardRouter` handles the path on the client. **Display** URLs use the real route `app/display/[[...slug]]` (e.g. `/display/{slug}?token=…`) so metadata can stay private (`noindex`) while the URL stays shareable from the dashboard.

## API highlights

| Area | Path |
|------|------|
| Sign up / login | `POST /auth/signup`, `POST /auth/login` |
| Current user | `GET /auth/me` |
| Screens | `GET/POST /screens`, `GET/PATCH/DELETE /screens/{id}` |
| Playlist (auth) | `GET/PUT /screens/{id}/playlist` |
| Media | `GET /media`, `POST /media/upload`, `DELETE /media/{id}` |
| Menus | `GET/POST /menus`, `GET/PUT /menus/{id}`, `GET /menus/{id}/preview`, `POST /menus/{id}/render` (202 + job) |
| Render jobs | `GET /jobs/{job_id}` |
| Display (public) | `GET /public/screens/{slug}/playlist?token=...` |
| Billing | `POST /billing/checkout`, `POST /billing/portal`, `POST /billing/webhook` |

When `ffprobe` is installed on the API host, video duration is detected for display in the media library (optional metadata).

## Production notes

- Deploy walkthrough: **[DEPLOY.md](DEPLOY.md)** (Railway API + Vercel web, env vars, volumes, migrations).
- Point **kemisdisplay.com** at Vercel; set `NEXT_PUBLIC_API_URL` to your API origin (e.g. `https://api.kemisdisplay.com`).
- Restrict `CORS_ORIGINS` to the real web origin (comma-separated; include preview URLs if you use them).
- If videos are served from **Cloudflare R2** (public bucket URLs in playlists), configure the bucket **CORS** to allow `GET` from your web origins (for example `https://www.kemisdisplay.com` and `https://kemisdisplay.com`). Otherwise some browsers and TVs fail to load `<video src="…">` with no visible API error.
- Set `DEV_BYPASS_BILLING=0`. Stripe Billing is wired for **Starter ($25/mo, 2 screens)** — see `STRIPE_*` and `WEB_APP_URL` in [`api/.env.example`](api/.env.example) and **[DEPLOY.md](DEPLOY.md)**.
- Railway’s `DATABASE_URL` may use the `postgres://` scheme; the API normalizes it to `postgresql://` for SQLAlchemy.
