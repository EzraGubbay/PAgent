.PHONY: all dev up local test clean help

# Default target: Triggers 'dev'
all: dev

# Full Development Environment (Local Backend + Frontend)
# 1. Starts dependencies (Redis, Mongo) in Docker
# 2. Runs Backend (Local) and Frontend (iOS) concurrently
dev:
	@echo "---------------------------------------------------"
	@echo "Starting Dependencies (Redis, Mongo)..."
	docker compose up -d --scale backend=0
	@echo "Starting Local Backend & Frontend..."
	@echo "---------------------------------------------------"
	npx -y concurrently -k -n "BACKEND,FRONTEND" -c "blue,magenta" \
		"cd backend && REDIS_URL=redis://localhost:6379 DATABASE_URL=mongodb://localhost:27017 uvicorn app.main:combined --host 0.0.0.0 --port 8000 --reload" \
		"cd frontend && npm run ios"

# Dockerized Backend Environment
# Starts everything in Docker (Backend, Redis, Mongo).
# Useful if you don't want to run Python locally.
up:
	docker compose up -d

# Local Backend Development
# 1. Starts all dependencies (Redis, Mongo, etc.) by scaling 'backend' to 0.
#    This effectively starts "everything except the backend app".
# 2. Runs the Backend App locally on the host machine with Hot Reload.
local:
	@echo "Starting dependencies (excluding dockerized backend)..."
	docker compose up -d --scale backend=0
	@echo "Starting local backend with Hot Reload..."
	cd backend && uvicorn app.main:combined --host 0.0.0.0 --port 8000 --reload

# Test Runner
test:
	@echo "Starting dependencies..."
	docker compose up -d --scale backend=0
	@echo "Running Backend Tests..."
	cd backend && pytest

# Cleanup
clean:
	@echo "Stopping all containers..."
	docker compose down
	@echo "Cleaning temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	@echo "Done."

help:
	@echo "Available commands:"
	@echo "  make dev    - (Default) Start FULL Docker stack + Frontend (iOS)"
	@echo "  make local  - Start dependencies in Docker, run Backend on Host (Hot Reload)"
	@echo "  make test   - Run backend tests (with Docker dependencies)"
	@echo "  make clean  - Sotp everything and clean up"
