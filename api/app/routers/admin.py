from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_admin_user
from app.models import Media, Screen, User
from app.schemas import AdminUserRow, AdminUserUpdate
from app.services.limits import effective_tier

router = APIRouter()

ALLOWED_PLANS = frozenset({"trialing", "starter", "pro", "business"})


@router.get("/users", response_model=list[AdminUserRow])
def list_users(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    limit: int = 500,
) -> list[AdminUserRow]:
    limit = min(max(limit, 1), 2000)
    users = db.scalars(select(User).order_by(User.created_at.desc()).limit(limit)).all()

    sc_rows = db.execute(
        select(Screen.user_id, func.count(Screen.id)).group_by(Screen.user_id)
    ).all()
    screen_map = {row[0]: int(row[1]) for row in sc_rows}

    md_rows = db.execute(
        select(Media.user_id, func.count(Media.id)).group_by(Media.user_id)
    ).all()
    media_map = {row[0]: int(row[1]) for row in md_rows}

    out: list[AdminUserRow] = []
    for u in users:
        out.append(
            AdminUserRow(
                id=u.id,
                email=u.email,
                business_name=u.business_name,
                plan=u.plan,
                trial_ends_at=u.trial_ends_at,
                is_admin=u.is_admin,
                created_at=u.created_at,
                effective_tier=effective_tier(u),
                screen_count=screen_map.get(u.id, 0),
                media_count=media_map.get(u.id, 0),
            )
        )
    return out


@router.get("/users/{user_id}", response_model=AdminUserRow)
def get_user(
    user_id: UUID,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> AdminUserRow:
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    sc = (
        db.scalar(select(func.count()).select_from(Screen).where(Screen.user_id == u.id))
        or 0
    )
    mc = (
        db.scalar(select(func.count()).select_from(Media).where(Media.user_id == u.id))
        or 0
    )
    return AdminUserRow(
        id=u.id,
        email=u.email,
        business_name=u.business_name,
        plan=u.plan,
        trial_ends_at=u.trial_ends_at,
        is_admin=u.is_admin,
        created_at=u.created_at,
        effective_tier=effective_tier(u),
        screen_count=int(sc),
        media_count=int(mc),
    )


@router.patch("/users/{user_id}", response_model=AdminUserRow)
def update_user(
    user_id: UUID,
    body: AdminUserUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> AdminUserRow:
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    if body.plan is not None and body.plan not in ALLOWED_PLANS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid plan")

    if body.is_admin is False and u.id == admin.id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "You cannot remove your own admin access.",
        )

    if body.business_name is not None:
        u.business_name = body.business_name.strip()
    if body.plan is not None:
        u.plan = body.plan
    if body.is_admin is not None:
        u.is_admin = body.is_admin
    if body.trial_ends_at is not None:
        u.trial_ends_at = body.trial_ends_at

    db.commit()
    db.refresh(u)

    sc = (
        db.scalar(select(func.count()).select_from(Screen).where(Screen.user_id == u.id))
        or 0
    )
    mc = (
        db.scalar(select(func.count()).select_from(Media).where(Media.user_id == u.id))
        or 0
    )
    return AdminUserRow(
        id=u.id,
        email=u.email,
        business_name=u.business_name,
        plan=u.plan,
        trial_ends_at=u.trial_ends_at,
        is_admin=u.is_admin,
        created_at=u.created_at,
        effective_tier=effective_tier(u),
        screen_count=int(sc),
        media_count=int(mc),
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
) -> None:
    if user_id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete your own account")
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    db.delete(u)
    db.commit()
