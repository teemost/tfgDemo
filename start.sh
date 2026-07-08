#!/usr/bin/env bash
# Trade Fast Gold — local startup script
#
# Requirements:
#   - Node.js 20+
#   - pnpm 9+ (npm install -g pnpm)
#   - A reachable PostgreSQL database
#   - Environment variables set before running (see .env.example):
#       DATABASE_URL   - Postgres connection string
#       SESSION_SECRET - random string used to sign session cookies
#
# Starts both the API server and the frontend dev server.
# Run from the project root: ./start.sh
#
# Note: if the Replit workflows ("API Server" / "Start application") are
# already running, stop them first to avoid port conflicts (EADDRINUSE).

set -e

cd "$(dirname "$0")"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is not installed. Install it with: npm install -g pnpm" >&2
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set. Export it or add it to a .env file before running." >&2
  exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "Error: SESSION_SECRET is not set. Export it or add it to a .env file before running." >&2
  exit 1
fi

echo "Installing dependencies..."
pnpm install

echo "Applying database schema (drizzle push)..."
(cd lib/db && pnpm run push)

echo "Starting API Server on port 8080..."
(cd artifacts/api-server && PORT=8080 pnpm run dev) &
API_PID=$!

echo "Starting frontend on port 22003..."
(cd artifacts/trade-fast-gold && PORT=22003 BASE_PATH=/ pnpm run dev) &
WEB_PID=$!

trap "echo 'Stopping...'; kill $API_PID $WEB_PID 2>/dev/null" EXIT INT TERM

wait
