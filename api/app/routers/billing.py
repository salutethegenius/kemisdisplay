"""Stripe Checkout, Customer Portal, and subscription webhooks."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal, get_db
from app.deps import get_current_user
from app.models import User

logger = logging.getLogger("kemisdisplay")

router = APIRouter()


class BillingUrlOut(BaseModel):
    url: str


def _require_stripe() -> None:
    if not settings.stripe_enabled:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Billing is not configured on this server.",
        )
    stripe.api_key = settings.stripe_secret_key.strip()


def _web_base() -> str:
    return settings.web_app_url.strip().rstrip("/") or "https://kemisdisplay.com"


def _ensure_stripe_customer(db: Session, user: User) -> str:
    if user.stripe_customer_id:
        return user.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        name=user.business_name or None,
        metadata={"user_id": str(user.id)},
    )
    user.stripe_customer_id = customer.id
    db.add(user)
    db.commit()
    db.refresh(user)
    return customer.id


def _revoke_paid_access(user: User) -> None:
    user.plan = "trialing"
    user.trial_ends_at = datetime.now(timezone.utc)


def _grant_starter(user: User) -> None:
    user.plan = "starter"


def _user_by_stripe_customer(db: Session, customer_id: str | None) -> User | None:
    if not customer_id:
        return None
    return db.scalar(select(User).where(User.stripe_customer_id == customer_id))


def _user_from_subscription_metadata(db: Session, sub: dict) -> User | None:
    meta = sub.get("metadata") or {}
    uid = meta.get("user_id")
    if not uid:
        return None
    try:
        return db.get(User, UUID(str(uid)))
    except ValueError:
        return None


@router.post("/checkout", response_model=BillingUrlOut)
def create_checkout(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillingUrlOut:
    _require_stripe()
    if user.plan in ("starter", "pro", "business"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "You already have an active paid plan. Use Manage billing to change it.",
        )

    customer_id = _ensure_stripe_customer(db, user)
    base = _web_base()
    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=customer_id,
            line_items=[
                {
                    "price": settings.stripe_price_id_starter.strip(),
                    "quantity": 1,
                }
            ],
            success_url=f"{base}/dashboard/account?billing=success",
            cancel_url=f"{base}/dashboard/account?billing=cancel",
            client_reference_id=str(user.id),
            metadata={"user_id": str(user.id)},
            subscription_data={"metadata": {"user_id": str(user.id)}},
            allow_promotion_codes=True,
        )
    except stripe.StripeError as e:
        logger.exception("Stripe Checkout Session create failed")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "Could not start checkout. Please try again.",
        ) from e

    if not session.url:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "Checkout session missing redirect URL.",
        )
    return BillingUrlOut(url=session.url)


@router.post("/portal", response_model=BillingUrlOut)
def create_portal(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BillingUrlOut:
    _require_stripe()
    if not user.stripe_customer_id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "No billing account yet. Subscribe first.",
        )

    base = _web_base()
    try:
        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{base}/dashboard/account",
        )
    except stripe.StripeError as e:
        logger.exception("Stripe Portal Session create failed")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "Could not open billing portal. Please try again.",
        ) from e

    return BillingUrlOut(url=session.url)


def _handle_checkout_completed(db: Session, session_obj: dict) -> None:
    if session_obj.get("mode") != "subscription":
        return
    customer_id = session_obj.get("customer")
    user: User | None = None
    ref = session_obj.get("client_reference_id")
    if ref:
        try:
            user = db.get(User, UUID(str(ref)))
        except ValueError:
            user = None
    if user is None:
        meta = session_obj.get("metadata") or {}
        uid = meta.get("user_id")
        if uid:
            try:
                user = db.get(User, UUID(str(uid)))
            except ValueError:
                user = None
    if user is None and customer_id:
        user = _user_by_stripe_customer(db, str(customer_id))
    if user is None:
        logger.warning("checkout.session.completed: no user for session %s", session_obj.get("id"))
        return

    if customer_id and user.stripe_customer_id != customer_id:
        user.stripe_customer_id = str(customer_id)
    _grant_starter(user)
    db.add(user)
    db.commit()


def _handle_subscription_updated(db: Session, sub: dict) -> None:
    status_val = str(sub.get("status") or "")
    user = _user_from_subscription_metadata(db, sub) or _user_by_stripe_customer(
        db, str(sub.get("customer") or "") or None
    )
    if user is None:
        logger.warning("subscription.updated: no user for sub %s", sub.get("id"))
        return

    customer_id = sub.get("customer")
    if customer_id and user.stripe_customer_id != customer_id:
        user.stripe_customer_id = str(customer_id)

    if status_val in ("active", "trialing", "past_due"):
        _grant_starter(user)
    elif status_val in ("canceled", "unpaid", "incomplete_expired"):
        _revoke_paid_access(user)

    db.add(user)
    db.commit()


def _handle_subscription_deleted(db: Session, sub: dict) -> None:
    user = _user_from_subscription_metadata(db, sub) or _user_by_stripe_customer(
        db, str(sub.get("customer") or "") or None
    )
    if user is None:
        logger.warning("subscription.deleted: no user for sub %s", sub.get("id"))
        return
    _revoke_paid_access(user)
    db.add(user)
    db.commit()


@router.post("/webhook")
async def stripe_webhook(request: Request) -> dict[str, str]:
    if not settings.stripe_secret_key.strip() or not settings.stripe_webhook_secret.strip():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Stripe webhook not configured",
        )

    stripe.api_key = settings.stripe_secret_key.strip()
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig,
            settings.stripe_webhook_secret.strip(),
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid payload") from e
    except stripe.SignatureVerificationError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid signature") from e

    event_type = event["type"]
    data_object = event["data"]["object"]

    db = SessionLocal()
    try:
        if event_type == "checkout.session.completed":
            _handle_checkout_completed(db, data_object)
        elif event_type == "customer.subscription.updated":
            _handle_subscription_updated(db, data_object)
        elif event_type == "customer.subscription.deleted":
            _handle_subscription_deleted(db, data_object)
        elif event_type == "invoice.payment_failed":
            # Smart Retries keep access during past_due; subscription.updated handles unpaid/canceled.
            logger.info(
                "invoice.payment_failed customer=%s invoice=%s",
                data_object.get("customer"),
                data_object.get("id"),
            )
        else:
            logger.debug("Ignoring Stripe event type=%s", event_type)
    except Exception:
        logger.exception("Stripe webhook handler error type=%s", event_type)
        db.rollback()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Webhook handler failed")
    finally:
        db.close()

    return {"status": "ok"}
