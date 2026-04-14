"""Verify Mux webhook signatures (Mux-Signature header)."""

from __future__ import annotations

import hashlib
import hmac
import time


def verify_mux_signature(
    raw_body: bytes,
    mux_signature_header: str | None,
    secret: str,
    tolerance_seconds: int = 300,
) -> None:
    """
    Raises ValueError if the signature is missing or invalid.
    Follows https://docs.mux.com/core/verify-webhook-signatures
    """
    if not secret:
        raise ValueError("Webhook signing secret not configured")
    if not mux_signature_header:
        raise ValueError("Missing Mux-Signature header")

    parts: dict[str, str] = {}
    for chunk in mux_signature_header.split(","):
        chunk = chunk.strip()
        if "=" not in chunk:
            continue
        k, v = chunk.split("=", 1)
        parts[k.strip()] = v.strip()

    ts_raw = parts.get("t")
    sig_hex = parts.get("v1")
    if not ts_raw or not sig_hex:
        raise ValueError("Invalid Mux-Signature format")

    try:
        ts = int(ts_raw)
    except ValueError as e:
        raise ValueError("Invalid timestamp in Mux-Signature") from e

    now = int(time.time())
    if abs(now - ts) > tolerance_seconds:
        raise ValueError("Mux-Signature timestamp outside tolerance")

    signed_payload = f"{ts_raw}.{raw_body.decode('utf-8')}"
    expected = hmac.new(
        secret.encode("utf-8"),
        signed_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, sig_hex):
        raise ValueError("Invalid Mux webhook signature")
