import json
import shutil
import subprocess
from pathlib import Path


def probe_video_duration_seconds(path: Path) -> float | None:
    if not shutil.which("ffprobe"):
        return None
    try:
        r = subprocess.run(
            [
                "ffprobe",
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                str(path),
            ],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if r.returncode != 0:
            return None
        data = json.loads(r.stdout or "{}")
        dur = data.get("format", {}).get("duration")
        return float(dur) if dur is not None else None
    except (OSError, ValueError, subprocess.TimeoutExpired, json.JSONDecodeError):
        return None
