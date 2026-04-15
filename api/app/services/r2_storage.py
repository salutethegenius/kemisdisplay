"""Cloudflare R2 uploads (S3-compatible API)."""

from __future__ import annotations

import logging

import boto3
from botocore.config import Config

from app.config import settings

logger = logging.getLogger("kemisdisplay")


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id.strip()}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id.strip(),
        aws_secret_access_key=settings.r2_secret_access_key.strip(),
        config=Config(signature_version="s3v4"),
    )


def upload_to_r2(file_path: str, key: str, content_type: str = "video/mp4") -> str:
    client = get_r2_client()
    client.upload_file(
        file_path,
        settings.r2_bucket_name.strip(),
        key,
        ExtraArgs={"ContentType": content_type},
    )
    logger.info("Uploaded to R2: %s", key)
    base = settings.r2_public_url.strip().rstrip("/")
    return f"{base}/{key}"


def check_r2_connection() -> dict[str, str]:
    """Validate R2 credentials and bucket with a lightweight head_bucket call."""
    if not settings.r2_enabled:
        return {"status": "disabled", "detail": "R2 credentials not fully configured"}
    try:
        client = get_r2_client()
        client.head_bucket(Bucket=settings.r2_bucket_name.strip())
        return {"status": "ok", "bucket": settings.r2_bucket_name.strip()}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


def delete_from_r2(key: str) -> bool:
    try:
        client = get_r2_client()
        client.delete_object(Bucket=settings.r2_bucket_name.strip(), Key=key)
        logger.info("Deleted from R2: %s", key)
        return True
    except Exception as e:
        logger.error("Failed to delete from R2 (%s): %s", key, e)
        return False
