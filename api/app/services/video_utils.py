"""FFmpeg helpers for video thumbnails."""

from __future__ import annotations

import logging
import shutil
import subprocess
from pathlib import Path

logger = logging.getLogger("kemisdisplay")


def generate_thumbnail(
    video_path: str | Path,
    output_path: str | Path,
    timestamp: str = "00:00:02",
    width: int = 640,
) -> bool:
    if not shutil.which("ffmpeg"):
        logger.warning("ffmpeg not on PATH; skipping thumbnail")
        return False
    vp = Path(video_path)
    op = Path(output_path)
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(vp),
                "-ss",
                timestamp,
                "-frames:v",
                "1",
                "-vf",
                f"scale={width}:-1",
                "-q:v",
                "2",
                str(op),
            ],
            capture_output=True,
            timeout=30,
            check=True,
        )
        logger.info("Generated thumbnail: %s", op)
        return True
    except (OSError, subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
        logger.error("Failed to generate thumbnail: %s", e)
        return False
