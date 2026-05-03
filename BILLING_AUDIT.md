# Billing audit (codebase verification)

**Scope:** Read-only review of how plans, trials, and limits are enforced in the API and surfaced in the web app. **No schema changes** were made for this document.

**Audited snapshot:** `main` as of Task 2 (post–launch hardening v2).

---

## 1. Source of truth

| Concern | Location |
| --- | --- |
| Tier resolution, caps | [`api/app/services/limits.py`](api/app/services/limits.py) |
| Plan / trial fields on user | [`api/app/models.py`](api/app/models.py) (`User.plan`, `User.trial_ends_at`, `User.kemispay_customer_id`) |
| Dev-only bypass | [`api/app/config.py`](api/app/config.py) — `DEV_BYPASS_BILLING` → `settings.dev_bypass_billing` |
| Manual plan changes | [`api/app/routers/admin.py`](api/app/routers/admin.py) — `PATCH /admin/users/{id}` |

---

## 2. `effective_tier` behavior

Implemented in `effective_tier()` ([`limits.py`](api/app/services/limits.py)):

1. **`DEV_BYPASS_BILLING`** — If true (local env: `1`, `true`, `yes`, `on`), every user is treated as **`business`** for limits and writes. **Must stay false in production** unless intentionally debugging.

2. **Paid plans** — If `user.plan` is `starter`, `pro`, or `business`, that string is the effective tier (no expiry check in code).

3. **Trial** — If `user.plan == "trialing"` **and** `now < trial_ends_at` (UTC-normalized), effective tier is **`starter`** (same caps as paid Starter).

4. **Otherwise** — `effective_tier` is **`None`** → no tier → writes that consult `billing_allows_write()` fail.

**Note:** There is **no** integration that syncs KemisPay subscription state into `plan` automatically. Paid access is whatever is stored in `users.plan` (plus admin updates).

---

## 3. Numeric limits (hard-coded)

From [`limits.py`](api/app/services/limits.py):

| Tier | Max screens | Storage quota |
| --- | --- | --- |
| `starter` | 4 | 1 GiB (`1 << 30`) |
| `pro` | 10 | 5 GiB |
| `business` | 25 | 20 GiB |

Trialing users use **Starter** numbers via effective tier `starter`.

**Per-upload ceiling:** [`api/app/routers/media.py`](api/app/routers/media.py) enforces **`MAX_UPLOAD_BYTES` = 100 MB** before plan storage checks — absolute cap regardless of tier.

---

## 4. Where enforcement runs

| Endpoint area | Guard | Notes |
| --- | --- | --- |
| `POST /media/upload` | `billing_allows_write`, storage quota | Quota = sum of `Media.size_bytes` for user vs `max_storage_bytes_for` |
| `POST /screens` | `billing_allows_write`, screen count vs `max_screens_for` | |
| `PUT .../playlist` | `billing_allows_write` | Full playlist replace |
| `POST /menus`, `PUT /menus/{id}`, `POST /menus/{id}/render` | `billing_allows_write` | |

**Intentionally not gated by `billing_allows_write` (typical product reasons):**

| Endpoint | Rationale (observed behavior) |
| --- | --- |
| `PATCH /screens/{id}`, `DELETE /screens/{id}` | User can rename, rotate token, or delete after trial ends |
| `DELETE /media/{id}` | Freeing storage / cleanup |
| `GET` handlers, onboarding `POST /onboarding/dismiss`, `GET /jobs/{id}` | Read or lightweight UX state |

If product policy should **block all mutations** after expiry except delete, that would be a separate change (not part of this audit).

---

## 5. KemisPay

**Grep result:** `kemispay_customer_id` appears only in [`api/app/models.py`](api/app/models.py) and the initial Alembic migration. **No router, service, or webhook** reads or writes it yet.

**Web:** [`web/src/components/dashboard-views.tsx`](web/src/components/dashboard-views.tsx) (Account page) states that billing via KemisPay is **Phase 3** and mentions local `DEV_BYPASS_BILLING`.

**Implication:** Subscription lifecycle (payment succeeded / failed / cancel) is **out of band** until KemisPay is wired; **`plan` must be updated** (admin API or future webhook/job) to match reality.

---

## 6. Admin API

- [`api/app/routers/admin.py`](api/app/routers/admin.py): `PATCH /admin/users/{user_id}` can set `plan`, `trial_ends_at`, `business_name`, `is_admin`.
- Allowed plans: `trialing`, `starter`, `pro`, `business` (aligned with [`api/app/schemas.py`](api/app/schemas.py) `AdminUserUpdate` / `User` validators).
- **`kemispay_customer_id` is not exposed** on admin list/get/patch in current schemas — adding it would be a small API/schema change when KemisPay integration lands.

---

## 7. Web display vs API

- Auth context exposes `plan`, `trial_ends_at`, `effective_tier` ([`web/src/lib/auth-context.tsx`](web/src/lib/auth-context.tsx)); dashboard Account page shows them.
- Marketing copy (landing, signup, OG images) references **14-day trial**, **$25/mo**, **up to 4 screens** — consistent with **Starter** tier in code.

---

## 8. Risks and recommendations (no code in this task)

1. **Plan drift** — Without KemisPay webhooks (or manual admin discipline), a churned subscriber could still show `plan=starter` in DB and receive full API access. **Mitigation:** Process + eventual automation when Phase 3 ships.

2. **`DEV_BYPASS_BILLING` on Railway** — Confirm production env does **not** set this (including accidental copy-paste from `.env.example`).

3. **Future KemisPay work** — Populate `kemispay_customer_id` on signup or first checkout; add verified webhook handler to update `plan` / trial; consider exposing the id in admin read-only for support.

4. **Optional policy clarity** — Decide whether expired trials may still **edit** screens/playlists (today: playlist/menu/media writes are blocked; some screen/media mutations are not).

---

## 9. Verification checklist (manual)

- [ ] New signup: `plan=trialing`, `trial_ends_at` ~14 days out; `effective_tier` is `starter`; uploads and screen creation work within Starter limits.
- [ ] After setting `trial_ends_at` in the past (or waiting): `effective_tier` null; `POST /media/upload` and `PUT` playlist return **403** with the standard message.
- [ ] Admin `PATCH` user to `starter` / `pro` / `business`: limits match **§3**.
- [ ] Production: `DEV_BYPASS_BILLING` unset or false.
