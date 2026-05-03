"""Migrate legacy on-disk image Media rows to Cloudflare R2.

Selects ``Media`` rows with ``type='image'`` and ``storage_provider IS NULL``
(legacy URLs served from ``/files/{user_id}/{filename}``).

Usage (from ``api/`` with venv active and ``DATABASE_URL`` in ``.env``).

Dry-run (default — no ``--apply``)::

    python -m scripts.migrate_local_images_to_r2

Apply (upload, update DB, delete local file)::

    python -m scripts.migrate_local_images_to_r2 --apply

Do not append shell comments on the same line as the command; some environments
pass ``#`` through to Python. Requires R2 env vars for ``--apply`` (see
``settings.r2_enabled``).
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from sqlalchemy import select

from app.config import settings
from app.database import SessionLocal
from app.models import Media
from app.services.r2_storage import upload_to_r2

_FILES_PATH_RE = re.compile(r"/files/([^/]+)/([^/?#]+)")


def _image_content_type(ext: str) -> str:
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }.get(ext.lower(), "application/octet-stream")


def local_disk_path(media: Media) -> Path | None:
    fu = (media.file_url or "").strip()
    m = _FILES_PATH_RE.search(fu)
    if not m:
        return None
    user_part, fname = m.group(1), m.group(2)
    return Path(settings.upload_dir) / user_part / fname


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Upload to R2, update DB, remove local file after success.",
    )
    args = parser.parse_args()

    if args.apply and not settings.r2_enabled:
        print(
            "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, "
            "R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL.",
            file=sys.stderr,
        )
        return 2

    db = SessionLocal()
    try:
        rows = db.scalars(
            select(Media).where(
                Media.type == "image",
                Media.storage_provider.is_(None),
            )
        ).all()
        if not rows:
            print("No legacy disk image rows (type=image, storage_provider IS NULL).")
            return 0

        migrated = 0
        skipped = 0
        errors = 0

        for media in rows:
            path = local_disk_path(media)
            if path is None:
                print(f"SKIP {media.id}: file_url does not look like /files/… ({media.file_url!r})")
                skipped += 1
                continue
            if not path.is_file():
                print(f"SKIP {media.id}: missing on disk {path}")
                skipped += 1
                continue

            ext = path.suffix.lower() or ".jpg"
            key = f"images/{media.id}{ext}"
            ctype = _image_content_type(ext)

            if not args.apply:
                print(
                    f"DRY-RUN would migrate {media.id}  {path}  →  R2 key {key}  "
                    f"({(media.size_bytes or 0) / 1024:.1f} KiB)"
                )
                migrated += 1
                continue

            try:
                file_url = upload_to_r2(str(path), key, content_type=ctype)
                media.storage_provider = "r2"
                media.r2_key = key
                media.file_url = file_url
                media.thumbnail_url = file_url
                db.commit()
                path.unlink(missing_ok=True)
                print(f"OK {media.id}  →  {file_url}")
                migrated += 1
            except Exception as exc:
                db.rollback()
                print(f"ERROR {media.id}: {exc}", file=sys.stderr)
                errors += 1

        print(
            f"\nDone: migrated={migrated}, skipped={skipped}, errors={errors} "
            f"(mode={'apply' if args.apply else 'dry-run'})"
        )
        return 1 if errors else 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
