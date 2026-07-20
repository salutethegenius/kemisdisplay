# Billing audit

**Updated:** Stripe Billing launch (Starter $25/mo, 2 screens).

---

## 1. Source of truth

| Concern | Location |
| --- | --- |
| Tier resolution, caps | [`api/app/services/limits.py`](api/app/services/limits.py) |
| Plan / trial / Stripe customer | [`api/app/models.py`](api/app/models.py) (`User.plan`, `User.trial_ends_at`, `User.stripe_customer_id`) |
| Checkout / portal / webhooks | [`api/app/routers/billing.py`](api/app/routers/billing.py) |
| Dev-only bypass | [`api/app/config.py`](api/app/config.py) — `DEV_BYPASS_BILLING` |
| Manual plan changes | [`api/app/routers/admin.py`](api/app/routers/admin.py) — `PATCH /admin/users/{id}` |
| Comp (free-for-life) promotion | [`api/scripts/comp_user.py`](api/scripts/comp_user.py) — `python -m scripts.comp_user <email> --apply` |

---

## 2. `effective_tier` behavior

1. **`DEV_BYPASS_BILLING`** — Treats every user as **`business`**. Must stay false in production.
2. **`comp`** — Complimentary / free-for-life accounts → effective **`starter`** (2 screens, 1 GiB). Admin-granted only; never gets a `stripe_customer_id`, so Stripe webhooks cannot revoke it. Blocked from Checkout.
3. **Paid plans** — `starter` / `pro` / `business` → that tier.
4. **Trial** — `plan == "trialing"` and `now < trial_ends_at` → effective **`starter`**.
5. **Otherwise** — `None` → writes blocked.

Stripe webhooks set `plan=starter` on successful Checkout / active subscription, and revoke paid access (`plan=trialing`, `trial_ends_at=now`) on `canceled` / `unpaid` / subscription deleted. `past_due` keeps `starter` while Smart Retries run. Comp accounts are never matched by webhooks (no `stripe_customer_id`, no subscription metadata), so they persist for life.

---

## 3. Numeric limits

| Tier | Max screens | Storage |
| --- | --- | --- |
| `starter` | **2** | 1 GiB |
| `pro` | 10 | 5 GiB |
| `business` | 25 | 20 GiB |
| `comp` | 2 (starter-tier) | 1 GiB — free for life, admin-granted only |

Public Checkout sells **Starter only** (`STRIPE_PRICE_ID_STARTER` = `price_1Tu2t42a7Qn43sncBvarThae`, $25 USD/month). Pro/Business remain admin-only. `comp` is admin-only (via `PATCH /admin/users/{id}` or `api/scripts/comp_user.py`).

---

## 4. Customer flows

| Flow | Path |
| --- | --- |
| 14-day trial (no card) | `POST /auth/signup` |
| Subscribe | Account → `POST /billing/checkout` → Stripe Checkout |
| Manage / cancel | Account → `POST /billing/portal` → Stripe Customer Portal |
| Plan sync | `POST /billing/webhook` (signature-verified) |

---

## 5. Env (Railway)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_STARTER`
- `WEB_APP_URL` (e.g. `https://www.kemisdisplay.com`)
- `DEV_BYPASS_BILLING=0`

Webhook URL: `https://<api-host>/billing/webhook`

---

## 6. Verification checklist

- [ ] Signup: `trialing`, 14-day trial, max **2** screens.
- [ ] Checkout live → webhook → `plan=starter`, `stripe_customer_id` set.
- [ ] Portal cancel → webhook → writes blocked.
- [ ] Comp: `python -m scripts.comp_user <email> --apply` → `plan=comp`, effective `starter`, no subscribe/portal UI, writes allowed (2 screens).
- [ ] Production: `DEV_BYPASS_BILLING` unset/false; Stripe Customer Portal enabled in Dashboard.
