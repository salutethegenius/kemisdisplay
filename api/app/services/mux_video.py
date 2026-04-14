"""Mux direct upload for local video files."""

from __future__ import annotations

import logging
from pathlib import Path
from uuid import UUID

import httpx
import mux_python
from mux_python.api.direct_uploads_api import DirectUploadsApi
from mux_python.api.assets_api import AssetsApi
from mux_python.models.create_asset_request import CreateAssetRequest
from mux_python.models.create_static_rendition_request import CreateStaticRenditionRequest
from mux_python.models.create_upload_request import CreateUploadRequest
from mux_python.models.playback_policy import PlaybackPolicy
from mux_python.rest import ApiException

from app.config import settings

logger = logging.getLogger("kemisdisplay")


def _api_client() -> mux_python.ApiClient:
    conf = mux_python.Configuration()
    conf.username = settings.mux_token_id.strip()
    conf.password = settings.mux_token_secret.strip()
    return mux_python.ApiClient(conf)


def ingest_local_video_file(local_path: Path, passthrough_media_id: UUID) -> None:
    """
    Create a Mux direct upload with public playback + static highest MP4, PUT file bytes, return.
    Completion is asynchronous via webhooks.
    """
    if not settings.mux_enabled:
        raise RuntimeError("Mux is not configured")

    path = local_path.expanduser().resolve()
    if not path.is_file():
        raise FileNotFoundError(str(path))

    body = path.read_bytes()
    new_asset = CreateAssetRequest(
        playback_policies=[PlaybackPolicy("public")],
        passthrough=str(passthrough_media_id),
        static_renditions=[CreateStaticRenditionRequest(resolution="highest")],
    )
    req = CreateUploadRequest(
        new_asset_settings=new_asset,
        timeout=3600,
    )

    client = _api_client()
    uploads_api = DirectUploadsApi(client)
    try:
        resp = uploads_api.create_direct_upload(req)
    except ApiException as e:
        logger.error("Mux create_direct_upload failed: %s %s", e.status, e.body)
        raise RuntimeError("Mux direct upload could not be created") from e
    finally:
        client.close()

    upload = resp.data
    put_url = upload.url
    if not put_url:
        raise RuntimeError("Mux upload URL missing")

    with httpx.Client(timeout=600.0) as http:
        r = http.put(put_url, content=body, headers={"Content-Type": "application/octet-stream"})
        if r.status_code >= 400:
            logger.error("Mux PUT upload failed: %s %s", r.status_code, r.text[:500])
            raise RuntimeError(f"Mux file upload failed ({r.status_code})")


def delete_mux_asset(mux_asset_id: str) -> None:
    if not settings.mux_enabled or not mux_asset_id:
        return
    client = _api_client()
    assets_api = AssetsApi(client)
    try:
        assets_api.delete_asset(mux_asset_id)
    except ApiException as e:
        if e.status == 404:
            return
        logger.warning("Mux delete_asset %s: %s %s", mux_asset_id, e.status, e.body)
    finally:
        client.close()
