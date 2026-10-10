# Multi-Stage Dockerfile for NUTANA (Frontend + Backend in Single Service)
# Stage 1: Build React/Vite Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json ./
# If package-lock.json exists, copy it
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Final Python/FastAPI runtime image
FROM python:3.12-slim AS runner
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ /app/backend/

# Copy frontend static build assets into backend static folder served by FastAPI
COPY --from=frontend-builder /app/backend/static /app/backend/static

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Railway passes runtime $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
