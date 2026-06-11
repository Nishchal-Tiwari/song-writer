#!/usr/bin/env bash
#
# Build the frontend + backend and (re)start the app under PM2.
# The NestJS API serves the React build from web/dist, so the whole app
# runs on a single origin (default http://localhost:3005) behind one domain.
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

if [ ! -f backend/.env ]; then
  echo "ERROR: backend/.env is missing. Copy .env.example to backend/.env and fill it in." >&2
  exit 1
fi

log "Installing dependencies"
( cd backend && npm install )
( cd web && npm install )

log "Building frontend (web/dist)"
( cd web && npm run build )

log "Building backend (backend/dist)"
( cd backend && npm run build )

log "Starting infrastructure (postgres + phonetik) via Docker"
docker compose up -d postgres phonetik

log "Reloading API with PM2"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

log "Done — app is available on http://localhost:3005"
pm2 status
