#!/usr/bin/env bash
# Dump KemisDisplay Postgres to ./backups/kemisdisplay-YYYYMMDD-HHMMSS.dump (custom format).
#
# Usage:
#   cd repo root; DATABASE_URL="postgresql://..." ./scripts/db_backup.sh
#   ./scripts/db_backup.sh "postgresql://kemis:kemis@localhost:5434/kemisdisplay"
#
# Requires: pg_dump (install Postgres client tools / libpq).
set -euo pipefail

url="${DATABASE_URL:-${1:-}}"
if [[ -z "$url" ]]; then
  echo "Usage: DATABASE_URL=<url> $0   OR   $0 <database_url>" >&2
  exit 1
fi

root="$(cd "$(dirname "$0")/.." && pwd)"
outdir="$root/backups"
mkdir -p "$outdir"
stamp="$(date +%Y%m%d-%H%M%S)"
file="$outdir/kemisdisplay-${stamp}.dump"

pg_dump "$url" -Fc -f "$file"
ls -la "$file"
echo "Wrote $file"
