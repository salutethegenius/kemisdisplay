import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Menu, RenderJob, Screen, User
from app.schemas import MenuCreate, MenuOut, MenuUpdate, RenderAccepted
from app.services.limits import billing_allows_write
from app.services.menu_html import build_chalkboard_html
from app.services.menu_render import release_render_slot, run_menu_render_job, try_acquire_render_slot

logger = logging.getLogger("kemisdisplay")

router = APIRouter()


def _menu_out(m: Menu) -> MenuOut:
    sec = m.sections if isinstance(m.sections, list) else []
    norm: list[dict] = [x for x in sec if isinstance(x, dict)]
    return MenuOut(
        id=m.id,
        user_id=m.user_id,
        screen_id=m.screen_id,
        title=m.title,
        theme=m.theme,
        footer_note=m.footer_note,
        sections=norm,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


def _sections_dump(sections: list) -> list:
    out = []
    for s in sections:
        if hasattr(s, "model_dump"):
            out.append(s.model_dump())
        else:
            out.append(dict(s))
    return out


def _assert_screen(db: Session, user_id: UUID, screen_id: UUID | None) -> None:
    if screen_id is None:
        return
    sc = db.get(Screen, screen_id)
    if not sc or sc.user_id != user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid screen_id")


@router.get("", response_model=list[MenuOut])
def list_menus(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MenuOut]:
    rows = db.scalars(select(Menu).where(Menu.user_id == user.id).order_by(Menu.updated_at.desc())).all()
    return [_menu_out(m) for m in rows]


@router.post("", response_model=MenuOut, status_code=status.HTTP_201_CREATED)
def create_menu(
    body: MenuCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MenuOut:
    if not billing_allows_write(user):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Trial ended or no active plan. Subscribe to continue.",
        )
    _assert_screen(db, user.id, body.screen_id)
    sec_data = _sections_dump(body.sections)
    if not sec_data:
        sec_data = [{"heading": "SPECIALS", "items": [{"name": "", "price": ""}]}]
    m = Menu(
        user_id=user.id,
        screen_id=body.screen_id,
        title=body.title.strip() or "Menu",
        theme=body.theme,
        footer_note=body.footer_note,
        sections=sec_data,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _menu_out(m)


@router.get("/{menu_id}", response_model=MenuOut)
def get_menu(
    menu_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MenuOut:
    m = db.get(Menu, menu_id)
    if not m or m.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menu not found")
    return _menu_out(m)


@router.put("/{menu_id}", response_model=MenuOut)
def update_menu(
    menu_id: UUID,
    body: MenuUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MenuOut:
    if not billing_allows_write(user):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Trial ended or no active plan. Subscribe to continue.",
        )
    m = db.get(Menu, menu_id)
    if not m or m.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menu not found")
    if body.screen_id is not None:
        _assert_screen(db, user.id, body.screen_id)
        m.screen_id = body.screen_id
    if body.title is not None:
        m.title = body.title.strip() or "Menu"
    if body.theme is not None:
        m.theme = body.theme
    if body.footer_note is not None:
        m.footer_note = body.footer_note
    if body.sections is not None:
        m.sections = _sections_dump(body.sections)
    m.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(m)
    return _menu_out(m)


@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu(
    menu_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if not billing_allows_write(user):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Trial ended or no active plan. Subscribe to continue.",
        )
    m = db.get(Menu, menu_id)
    if not m or m.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menu not found")
    db.delete(m)
    db.commit()


@router.get("/{menu_id}/preview")
def preview_menu(
    menu_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    m = db.get(Menu, menu_id)
    if not m or m.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menu not found")
    html = build_chalkboard_html(m)
    return Response(content=html, media_type="text/html; charset=utf-8")


@router.post("/{menu_id}/render", response_model=RenderAccepted, status_code=status.HTTP_202_ACCEPTED)
def render_menu(
    menu_id: UUID,
    background_tasks: BackgroundTasks,
    as_image: bool = Query(
        True,
        description="If true, export a full-page JPEG to R2 (best for TVs, no video encode). "
        "If false, generate a 10s H.264 MP4 (legacy).",
    ),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RenderAccepted:
    if not billing_allows_write(user):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Trial ended or no active plan. Subscribe to continue.",
        )
    m = db.get(Menu, menu_id)
    if not m or m.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Menu not found")

    if not try_acquire_render_slot():
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Menu renderer is busy. Try again in about a minute.",
        )
    try:
        job = RenderJob(user_id=user.id, menu_id=m.id, status="pending")
        db.add(job)
        db.commit()
        db.refresh(job)
    except Exception:
        release_render_slot()
        raise

    background_tasks.add_task(run_menu_render_job, job.id, as_image)
    return RenderAccepted(job_id=job.id, status="pending")
