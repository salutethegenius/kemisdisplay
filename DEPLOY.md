# Deploy KemisDisplay (Railway API + Vercel web)

## Prereqs

- GitHub (or Git) repo connected to **Railway** and **Vercel**
- **PostgreSQL** (Railway plugin is easiest — sets `DATABASE_URL` on the API service)
- Production **JWT secret** (long random string)
- Public **API URL** for file links (your Railway service URL, e.g. `https://your-api.up.railway.app`)

---

## Backend (Railway)

1. **New project → New service → Deploy from repo** (same repo as this monorepo).
2. In the service **Settings → Root Directory**, set **`api`** (folder that contains `app/`, `requirements.txt`, `alembic/`).
3. **Variables** (service → Variables), set at least:

| Variable | Example | Notes |
|----------|---------|--------|
| `DATABASE_URL` | *(from Postgres plugin)* | We normalize `postgres://` → `postgresql://` automatically. |
| `JWT_SECRET` | 64+ random chars | Required in production. |
| `CORS_ORIGINS` | `https://your-app.vercel.app,https://kemisdisplay.com` | Comma-separated, **no trailing slashes**. Must include every browser origin that calls the API. |
| `PUBLIC_API_BASE_URL` | `https://your-api.up.railway.app` | **No trailing slash.** Used in uploaded file URLs (`/files/...`). |
| `UPLOAD_DIR` | `/data/uploads` | Use a **persistent volume** path if you want uploads to survive redeploys (see below). |
| `MENU_RENDER_TMP` | `/tmp/menu_render` | Ephemeral temp is fine. |
| `DEV_BYPASS_BILLING` | `0` | Keep off in production. |
| `ADMIN_EMAILS` | `you@domain.com` | Optional; promotes existing users to admin on boot. |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | *(Mux dashboard → Access Tokens)* | Optional. When both are set, **new video uploads** and **menu-render MP4s** are sent to Mux (CDN + static `highest.mp4`). Images still use `UPLOAD_DIR` + `/files`. |
| `MUX_WEBHOOK_SIGNING_SECRET` | *(Mux → Webhooks → endpoint signing secret)* | Required in production if you use Mux: the API verifies `POST /mux/webhook` with this secret. |

4. **Mux webhook URL:** In the Mux dashboard, add a webhook endpoint pointing to `https://<your-public-api-host>/mux/webhook` and subscribe at least to `video.asset.ready`, `video.asset.static_rendition.ready`, and `video.asset.errored`.

5. **Disk / uploads:** Railway’s filesystem is ephemeral unless you add a **volume**. Mount e.g. `/data` and set `UPLOAD_DIR=/data/uploads` so **images** and any **non-Mux** video persist. Mux-hosted video does not need disk for the MP4 itself.

6. **Migrations:** `api/railway.json` runs **`alembic upgrade head`** as `preDeployCommand` before each deploy.

7. **Start command:** `uvicorn` binds `0.0.0.0` and **`PORT`** (Railway sets this). Defined in `api/railway.json`.

8. **Health check:** `GET /health` (configured in `railway.json`).

9. **Menu video rendering:** Needs **ffmpeg** (via `nixpacks.toml`) and **Playwright + Chromium** for captures. Do **not** run `playwright install` in Railway `startCommand` — it blocks `uvicorn` and `/health` will time out. After a successful deploy, use **Railway Shell** once: `playwright install chromium` (or bake browsers into a custom Dockerfile). Until then, menu jobs fail with a clear error; the rest of the API works.

---

## Frontend (Vercel)

1. **New Project → Import** the same repo.
2. **Root Directory:** `web` (contains `package.json`, `next.config.mjs`).
3. **Framework:** Next.js (auto).
4. **Environment variables:**

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.up.railway.app` | No trailing slash. |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your canonical site URL (optional but useful for links). |

5. **Redeploy** after changing env vars.

6. **CORS:** Every Vercel preview/production URL you use must appear in the API’s `CORS_ORIGINS` (comma-separated), or the browser will block `fetch`.

---

## Smoke test after deploy

1. `GET https://<api>/health` → `database: ok`
2. Open Vercel URL → sign up → create screen → upload media
3. Confirm `PUBLIC_API_BASE_URL/files/...` loads in the browser for an uploaded file

---

## PostgreSQL backups and restore drill

### Railway (production)

- In **Railway → your Postgres plugin → Data / Backups**, confirm **automated backups** are enabled and note the retention window (plan-dependent).
- For a **manual logical backup** you control end-to-end, install PostgreSQL client tools locally (`pg_dump` / `pg_restore`), copy **`DATABASE_URL`** from the Railway Postgres variables (or use a read replica URL if you add one), and run the script below.

### Local Docker (`docker compose` in this repo)

Default URL matches `api/.env.example`:

`postgresql://kemis:kemis@localhost:5434/kemisdisplay`

From the **repository root**:

```bash
docker compose up -d
./scripts/db_backup.sh "postgresql://kemis:kemis@localhost:5434/kemisdisplay"
```

This writes `backups/kemisdisplay-<timestamp>.dump` (custom format, **gitignored**). Requires `pg_dump` on your PATH.

### Restore drill (practice on a disposable DB)

**Warning:** `--clean` drops objects before recreating them. Only run against a database you are allowed to wipe (e.g. local Docker).

1. Stop anything using that DB (local API) if you want a quiet restore.
2. Restore:

```bash
pg_restore \
  --dbname "postgresql://kemis:kemis@localhost:5434/kemisdisplay" \
  --clean --if-exists --no-owner \
  backups/kemisdisplay-YYYYMMDD-HHMMSS.dump
```

3. Run **`alembic upgrade head`** in `api/` if the dump predates a migration (usually idempotent), then smoke-test `GET /health` and the dashboard.

If restore complains about ownership, `--no-owner` (above) is usually enough for local/dev. For cross-environment restores, match Postgres major versions when possible (this repo uses **Postgres 16** in `docker-compose.yml`).

---

## Monorepo tips

- **Railway** only builds the `api` folder when Root Directory = `api`.
- **Vercel** only builds `web` when Root Directory = `web`.
- Keep **two services** (Postgres + API) in Railway; link Postgres so `DATABASE_URL` is injected.
