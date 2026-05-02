"""Find Media rows that no Menu or PlaylistItem references.

A safety net for the menu auto-re-render flow: if swap_menu_current_media ever
fails silently, the old Media row would be left behind unreferenced. This script
finds those orphans (and optionally deletes them, including their stored bytes).

Usage (from api/, with .venv active and DATABASE_URL set in env or .env):

    python -m scripts.find_orphan_media                  # dry-run, list all orphans
    python -m scripts.find_orphan_media --user-id <uuid> # scope to one user
    python -m scripts.find_orphan_media --delete         # actually remove (interactive confirm)
    python -m scripts.find_orphan_media --delete --yes   # non-interactive
"""

from __future__ import annotations

import argparse
import sys
from uuid import UUID

import sqlalchemy as sa

from app.database import SessionLocal
from app.models import Media, Menu, PlaylistItem
from app.services.video_router import delete_stored_video


def find_orphans(db, user_id: UUID | None) -> list[Media]:
    referenced_by_menu = sa.select(Menu.current_media_id).where(
        Menu.current_media_id.is_not(None)
    )
    referenced_by_playlist = sa.select(PlaylistItem.media_id)

    q = sa.select(Media).where(
        Media.id.notin_(referenced_by_menu),
        Media.id.notin_(referenced_by_playlist),
    )
    if user_id is not None:
        q = q.where(Media.user_id == user_id)
    q = q.order_by(Media.created_at.asc())
    return list(db.execute(q).scalars().all())


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--user-id", help="Restrict to a single user_id (UUID).")
    p.add_argument(
        "--delete",
        action="store_true",
        help="Delete orphans (bytes + DB row). Default is dry-run.",
    )
    p.add_argument(
        "--yes",
        action="store_true",
        help="Skip interactive confirmation when --delete is set.",
    )
    args = p.parse_args()

    user_id: UUID | None = None
    if args.user_id:
        try:
            user_id = UUID(args.user_id)
        except ValueError:
            print(f"Invalid --user-id: {args.user_id}", file=sys.stderr)
            return 2

    db = SessionLocal()
    try:
        orphans = find_orphans(db, user_id)
        if not orphans:
            print("No orphan Media rows found.")
            return 0

        total_bytes = sum(m.size_bytes or 0 for m in orphans)
        print(f"Found {len(orphans)} orphan Media row(s), {total_bytes/1024/1024:.1f} MB total:")
        for m in orphans:
            print(
                f"  {m.id}  user={m.user_id}  type={m.type}  "
                f"storage={m.storage_provider or '?'}  "
                f"size={(m.size_bytes or 0)/1024/1024:.1f}MB  "
                f"created={m.created_at.isoformat()}  "
                f"file={m.filename}"
            )

        if not args.delete:
            print("\nDry-run only. Re-run with --delete to remove these.")
            return 0

        if not args.yes:
            ans = input(f"\nDelete all {len(orphans)} rows + their stored bytes? [y/N] ")
            if ans.strip().lower() not in ("y", "yes"):
                print("Aborted.")
                return 1

        deleted = 0
        for m in orphans:
            try:
                delete_stored_video(m)
            except Exception as e:
                print(f"  warn: storage delete failed for {m.id}: {e}", file=sys.stderr)
            try:
                db.delete(m)
                db.commit()
                deleted += 1
            except Exception as e:
                print(f"  error: row delete failed for {m.id}: {e}", file=sys.stderr)
                db.rollback()
        print(f"\nDeleted {deleted}/{len(orphans)} orphan Media row(s).")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
