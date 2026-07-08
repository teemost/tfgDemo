#!/usr/bin/env bash
# Trade Fast Gold — local startup script
#
# Starts both the API server and the frontend dev server.
# Run from the project root: ./start.sh
#
# Note: if the Replit workflows ("API Server" / "Start application") are
# already running, stop them first to avoid port conflicts (EADDRINUSE).

set -e

cd "$(dirname "$0")"

echo "Starting API Server on port 8080..."
(cd artifacts/api-server && PORT=8080 pnpm run dev) &
API_PID=$!

echo "Starting frontend on port 22003..."
(cd artifacts/trade-fast-gold && PORT=22003 BASE_PATH=/ pnpm run dev) &
WEB_PID=$!

trap "echo 'Stopping...'; kill $API_PID $WEB_PID 2>/dev/null" EXIT INT TERM

wait
