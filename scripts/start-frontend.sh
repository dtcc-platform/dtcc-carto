#!/usr/bin/env bash
set -euo pipefail

REPO_DIR=${1:-/opt/dtcc-carto}
PORT=${PORT:-5173}

cd "$REPO_DIR/frontend"

exec npm run preview -- --host 0.0.0.0 --port "$PORT"
