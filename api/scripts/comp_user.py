"""Grant a user complimentary (free-for-life) access by setting plan='comp'.

Comp accounts map to starter-tier limits (2 screens, 1 GiB) for life, are not
revocable by Stripe webhooks (no stripe_customer_id is ever created), and are
blocked from subscribing via Checkout. See ``api/app/services/limits.py``
(``effective_tier``) and ``BILLING_AUDIT.md``.

Usage (from ``api/`` with venv active and ``DATABASE_URL`` in ``.env``)::

    python -m scripts.comp_user ken@example.com           # dry-run
    python -m scripts.comp_user ken@example.com --apply   # commit

The lookup is case-insensitive (email is lowercased to match signup).
``trial_ends_at`` is left untouched — comp ignores it.
"""

from __future__ import annotations

import argparse
import sys

from sqlalchemy import select

from app.database import SessionLocal
from app.models import User
from app.services.limits import effective_tier


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("email", help="User email to promote to comp.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Commit the change. Without it, the script is a dry-run.",
    )
    args = parser.parse_args()

    email = args.email.strip().lower()
    if not email or "@" not in email:
        print(f"Invalid email: {args.email!r}", file=sys.stderr)
        return 2

    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            print(f"No user found with email {email!r}.", file=sys.stderr)
            return 1

        before_plan = user.plan
        before_tier = effective_tier(user)
        print(f"User:   {user.email}")
        print(f"  id:   {user.id}")
        print(f"  plan: {before_plan}  (effective_tier={before_tier!r})")
        print(f"  trial_ends_at: {user.trial_ends_at}")
        print(f"  stripe_customer_id: {user.stripe_customer_id or '—'}")

        if before_plan == "comp":
            print("\nAlready on the comp plan. Nothing to do.")
            return 0

        if not args.apply:
            print(
                f"\nDRY-RUN: would set plan {before_plan!r} -> 'comp' "
                f"(effective_tier -> 'starter'). Re-run with --apply to commit."
            )
            return 0

        user.plan = "comp"
        db.commit()
        db.refresh(user)
        print(
            f"\nOK: plan -> {user.plan!r}  (effective_tier={effective_tier(user)!r}). "
            "Access is now complimentary for life."
        )
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
