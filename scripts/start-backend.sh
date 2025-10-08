#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=${1:-/opt/dtcc-carto}
PORT=${PORT:-8000}
WORKERS=${WORKERS:-2}

cd "$REPO_DIR"

source backend/.venv/bin/activate
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers "$WORKERS"
