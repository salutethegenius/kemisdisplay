# Microsoft's official Playwright Python image — chromium + every system
# library it depends on come pre-installed and version-matched. Replaces the
# Nixpacks builder (deprecated by Railway) and the libglib/libnss-style
# runtime-lib gaps that the bare nixpacks Python image hit.
FROM mcr.microsoft.com/playwright/python:v1.49.0-jammy

# ffmpeg for menu video transcode (WebM → H.264 MP4). The base image is
# Ubuntu jammy, so apt is available.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps in their own layer for cache-friendliness.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Re-run `playwright install chromium` after the pip install. The base image
# already ships chromium for v1.49.0, but if requirements.txt resolves a newer
# playwright client, the bundled binary would be out of sync. This redownload
# keeps client and binary in lockstep without re-installing system libs.
RUN playwright install chromium

# Application source. Keep this last so source edits don't bust the pip layer.
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY scripts ./scripts

ENV PORT=8000
EXPOSE 8000

# railway.json's startCommand takes precedence in production, but this CMD
# keeps the image runnable standalone (e.g. for local docker run).
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
