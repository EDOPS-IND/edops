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
# 3. Ensure PostgreSQL is Running (Native Postgres.app or Docker Compose)
# ------------------------------------------------------------------------------
echo -e "${CYAN}[1/4] Checking PostgreSQL database...${RESET}"
DB_PORT=""

check_postgres_port() {
  local port=$1
  if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h 127.0.0.1 -p "$port" >/dev/null 2>&1
  else
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1
  fi
}

if check_postgres_port 5432; then
  DB_PORT="5432"
  echo -e "${GREEN}✔ PostgreSQL is running locally on port 5432.${RESET}"
elif check_postgres_port 15432; then
  DB_PORT="15432"
  echo -e "${GREEN}✔ PostgreSQL is running on port 15432.${RESET}"
else
  # Try launching Postgres.app if installed
  if [ -d "/Applications/Postgres.app" ]; then
    echo -e "${YELLOW}Starting Postgres.app...${RESET}"
    open -a Postgres || true
    for i in {1..10}; do
      if check_postgres_port 5432; then
        DB_PORT="5432"
        echo -e "${GREEN}✔ Postgres.app is healthy on port 5432.${RESET}"
        break
      fi
      sleep 1
    done
  fi

  # If still not running, try Docker Compose
  if [ -z "$DB_PORT" ] && command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo -e "${YELLOW}Starting PostgreSQL via Docker Compose...${RESET}"
    (cd "$BACKEND_DIR" && docker compose up -d --wait postgres)
    DB_PORT="15432"
    echo -e "${GREEN}✔ PostgreSQL is healthy on port 15432 (Docker).${RESET}"
  fi
fi

if [ -z "$DB_PORT" ]; then
  echo -e "${RED}[ERROR] PostgreSQL is not running.${RESET}"
  echo -e "${YELLOW}Please start Postgres.app or start Docker Desktop and re-run.${RESET}"
  exit 1
fi

# ------------------------------------------------------------------------------
# 4. Backend Preparation & Database Migrations
# ------------------------------------------------------------------------------
echo -e "${CYAN}[2/4] Initializing backend environment and database schema...${RESET}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo -e "${YELLOW}Creating backend .env file...${RESET}"
  (cd "$BACKEND_DIR" && npm run env:init)
fi

# Sync DATABASE_URL port in .env with active DB port
if grep -q "127.0.0.1:[0-9]*/edops" "$BACKEND_DIR/.env"; then
  sed -i '' "s|127.0.0.1:[0-9]*/edops|127.0.0.1:${DB_PORT}/edops|g" "$BACKEND_DIR/.env"
fi

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}Installing backend dependencies...${RESET}"
  (cd "$BACKEND_DIR" && npm install)
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies...${RESET}"
  (cd "$FRONTEND_DIR" && npm install)
fi

echo -e "Running database migrations..."
(cd "$BACKEND_DIR" && npm run db:migrate)
echo -e "${GREEN}✔ Database migrations applied.${RESET}"

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
