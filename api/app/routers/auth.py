from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import LoginBody, SignupBody, TokenResponse, UserOut
from app.security import create_access_token, hash_password, verify_password
from app.services.limits import effective_tier

router = APIRouter()


def _user_out(u: User) -> UserOut:
    return UserOut(
        id=u.id,
        email=u.email,
        business_name=u.business_name,
        plan=u.plan,
        trial_ends_at=u.trial_ends_at,
        effective_tier=effective_tier(u),
        is_admin=bool(u.is_admin),
    )


@router.post("/signup", response_model=TokenResponse)
def signup(body: SignupBody, db: Session = Depends(get_db)) -> TokenResponse:
    exists = db.scalar(select(User.id).where(User.email == body.email.lower().strip()))
    if exists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    trial_end = datetime.now(timezone.utc) + timedelta(days=14)
    user = User(
        email=body.email.lower().strip(),
        hashed_password=hash_password(body.password),
        business_name=body.business_name.strip(),
        plan="trialing",
        trial_ends_at=trial_end,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginBody, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == body.email.lower().strip()))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=_user_out(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return _user_out(user)
