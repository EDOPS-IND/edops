#!/usr/bin/env bash

# ==============================================================================
# EDOPS - Unified Startup Script
# Starts PostgreSQL (Docker), Backend (NestJS), and Frontend (Vinext)
# Automatically opens the application in your default browser.
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Colors for terminal output
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
MAGENTA="\033[0;35m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}"
echo "=========================================================="
echo "          🚀 Starting EDOPS SaaS Platform                 "
echo "=========================================================="
echo -e "${RESET}"

# ------------------------------------------------------------------------------
# 1. Check Prerequisites
# ------------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Node.js is not installed or not in PATH.${RESET}"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Docker is not installed or not in PATH.${RESET}"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Docker daemon is not running. Please start Docker Desktop first.${RESET}"
  exit 1
fi

# ------------------------------------------------------------------------------
# 2. Free up ports 3000 & 3001 if already occupied by stale processes
# ------------------------------------------------------------------------------
for port in 3000 3001; do
  STALE_PID=$(lsof -ti :$port -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$STALE_PID" ]; then
    echo -e "${YELLOW}[INFO] Port $port is already in use by PID $STALE_PID. Freeing port...${RESET}"
    kill -9 $STALE_PID 2>/dev/null || true
    sleep 1
  fi
done

# ------------------------------------------------------------------------------
# 3. Start PostgreSQL via Docker Compose
# ------------------------------------------------------------------------------
echo -e "${CYAN}[1/4] Starting PostgreSQL database...${RESET}"
(cd "$BACKEND_DIR" && docker compose up -d --wait postgres)
echo -e "${GREEN}✔ PostgreSQL is healthy on port 15432.${RESET}"

# ------------------------------------------------------------------------------
# 4. Backend Preparation & Database Migrations
# ------------------------------------------------------------------------------
echo -e "${CYAN}[2/4] Initializing backend environment and database schema...${RESET}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo -e "${YELLOW}Creating backend .env file...${RESET}"
  (cd "$BACKEND_DIR" && npm run env:init)
fi

echo -e "Running database migrations..."
(cd "$BACKEND_DIR" && npm run db:migrate)
echo -e "${GREEN}✔ Database migrations applied.${RESET}"

echo -e "Ensuring demo accounts and school data are seeded..."
(cd "$BACKEND_DIR" && npm run seed)
echo -e "${GREEN}✔ Demo users and school data ready.${RESET}"

# ------------------------------------------------------------------------------
# 5. Process Management & Cleanup Handlers
# ------------------------------------------------------------------------------
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo -e "${YELLOW}Stopping all services...${RESET}"
  
  if [ -n "$FRONTEND_PID" ]; then
    kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    pkill -TERM -P "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [ -n "$BACKEND_PID" ]; then
    kill -TERM "$BACKEND_PID" 2>/dev/null || true
    pkill -TERM -P "$BACKEND_PID" 2>/dev/null || true
  fi

  # Clean up listening ports
  lsof -ti :3000 -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti :3001 -sTCP:LISTEN 2>/dev/null | xargs kill -9 2>/dev/null || true

  echo -e "${GREEN}All services stopped cleanly.${RESET}"
  exit 0
}

trap cleanup INT TERM EXIT

# ------------------------------------------------------------------------------
# 6. Start Backend (NestJS)
# ------------------------------------------------------------------------------
echo -e "${CYAN}[3/4] Launching Backend API on http://127.0.0.1:3001...${RESET}"
(cd "$BACKEND_DIR" && npm run start:dev) 2>&1 | awk '{ print "\033[0;36m[backend]\033[0m  " $0; fflush(); }' &
BACKEND_PID=$!

# Wait for backend health check
echo -e "Waiting for Backend to be ready..."
BACKEND_READY=false
for i in {1..40}; do
  if curl -s -f http://127.0.0.1:3001/api/health >/dev/null 2>&1; then
    BACKEND_READY=true
    break
  fi
  sleep 1
done

if [ "$BACKEND_READY" = false ]; then
  echo -e "${RED}[ERROR] Backend failed to start within 40 seconds.${RESET}"
  exit 1
fi
echo -e "${GREEN}✔ Backend API is running!${RESET}"

# ------------------------------------------------------------------------------
# 7. Start Frontend (Vinext / Next.js)
# ------------------------------------------------------------------------------
echo -e "${CYAN}[4/4] Launching Frontend on http://127.0.0.1:3000...${RESET}"
(cd "$FRONTEND_DIR" && npm run dev) 2>&1 | awk '{ print "\033[0;35m[frontend]\033[0m " $0; fflush(); }' &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo -e "Waiting for Frontend to respond..."
FRONTEND_READY=false
for i in {1..30}; do
  if curl -s -f http://127.0.0.1:3000 >/dev/null 2>&1; then
    FRONTEND_READY=true
    break
  fi
  sleep 1
done

if [ "$FRONTEND_READY" = false ]; then
  echo -e "${YELLOW}[NOTE] Frontend launched. Waiting for bundle...${RESET}"
fi

# ------------------------------------------------------------------------------
# 8. Open Default Browser
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}${GREEN}==========================================================${RESET}"
echo -e "${BOLD}${GREEN}✨ EDOPS is running!${RESET}"
echo -e "  🌐 ${BOLD}Frontend:${RESET}    http://localhost:3000"
echo -e "  🔌 ${BOLD}Backend API:${RESET} http://localhost:3001"
echo -e "  📖 ${BOLD}API Docs:${RESET}    http://localhost:3001/api/docs"
echo -e "  📊 ${BOLD}Health:${RESET}      http://localhost:3001/api/health"
echo -e "${BOLD}${CYAN}----------------------------------------------------------${RESET}"
echo -e "${BOLD}${CYAN}🔑 Demo Logins (Password = Same as Email):${RESET}"
echo -e "  • Super Admin:  ${BOLD}superadmin@edops.com${RESET}"
echo -e "  • Admin:        ${BOLD}admin@edops.com${RESET}"
echo -e "  • School Admin: ${BOLD}school@edops.com${RESET}"
echo -e "  • Principal:    ${BOLD}principal@edops.com${RESET}"
echo -e "  • Teacher:      ${BOLD}teacher@edops.com${RESET}"
echo -e "  • Student:      ${BOLD}student@edops.com${RESET}"
echo -e "  • Parent:       ${BOLD}parent@edops.com${RESET}"
echo -e "${BOLD}${GREEN}==========================================================${RESET}"
echo -e "${YELLOW}Press Ctrl+C at any time to shut down all services.${RESET}\n"

if command -v open >/dev/null 2>&1; then
  # macOS
  open "http://localhost:3000"
elif command -v xdg-open >/dev/null 2>&1; then
  # Linux
  xdg-open "http://localhost:3000" >/dev/null 2>&1 || true
fi

# Keep script running and wait for child processes
wait
