from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import LoginBody, ProfileUpdateBody, SignupBody, TokenResponse, UserOut
from app.security import create_access_token, hash_password, verify_password
from app.services.limits import effective_tier
from app.services.slug import unique_account_slug, validate_account_slug

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def _user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        email=u.email,
        business_name=u.business_name,
        account_slug=u.account_slug,
        plan=u.plan,
        trial_ends_at=u.trial_ends_at,
        effective_tier=effective_tier(u),
        is_admin=bool(u.is_admin),
        has_billing_customer=bool(u.stripe_customer_id),
    )


@router.post("/signup", response_model=TokenResponse)
@limiter.limit("5/minute")
def signup(request: Request, body: SignupBody, db: Session = Depends(get_db)) -> TokenResponse:
    exists = db.scalar(select(User.id).where(User.email == body.email.lower().strip()))
    if exists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unable to create account with that email")
    trial_end = datetime.now(timezone.utc) + timedelta(days=14)
    business_name = body.business_name.strip()
    slug_source = business_name or body.email.split("@")[0]
    account_slug = unique_account_slug(db, slug_source)
    user = User(
        email=body.email.lower().strip(),
        hashed_password=hash_password(body.password),
        business_name=business_name,
        account_slug=account_slug,
        plan="trialing",
        trial_ends_at=trial_end,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, body: LoginBody, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == body.email.lower().strip()))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=_user_out(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return _user_out(user)


@router.patch("/me", response_model=UserOut)
def update_me(
    body: ProfileUpdateBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    try:
        slug = validate_account_slug(body.account_slug)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e)) from e
    if slug != user.account_slug:
        taken = db.scalar(select(User.id).where(User.account_slug == slug, User.id != user.id))
        if taken:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "That URL is already taken")
        user.account_slug = slug
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
    return _user_out(user)
