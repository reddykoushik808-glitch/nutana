import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.client import get_database, close_mongo_client
from app.db.indexes import create_indexes
from app.api.v1.router import api_router

setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Nutana Application...")
    try:
        db = get_database()
        create_indexes(db)
        logger.info("Nutana successfully started.")
    except Exception as e:
        logger.warning(f"Note on startup initialization: {e}")
    yield
    logger.info("Shutting down Nutana Application...")
    close_mongo_client()

app = FastAPI(
    title="NUTANA API",
    description="Kirana Grocery Intelligence & Zero-Waste Inventory Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & Ready probes
@app.get("/api/v1/health", tags=["system"])
def health_check():
    return {"status": "ok", "app": "nutana", "environment": settings.ENVIRONMENT}

@app.get("/api/v1/ready", tags=["system"])
def readiness_check():
    try:
        db = get_database()
        db.command("ping")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(status_code=503, content={"status": "not_ready", "database": "unreachable"})

# Include API Router
app.include_router(api_router, prefix="/api/v1")

# Single-Service Static files & SPA Fallback routing
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../static"))

if os.path.exists(STATIC_DIR):
    # Mount assets if available
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.middleware("http")
    async def spa_middleware(request: Request, call_next):
        # Allow API requests to go through
        if request.url.path.startswith("/api/"):
            return await call_next(request)

        # Check if requesting a direct static file
        relative_path = request.url.path.lstrip("/")
        potential_file = os.path.join(STATIC_DIR, relative_path)
        if relative_path and os.path.isfile(potential_file):
            return FileResponse(potential_file)

        # Non-API route falls back to SPA index.html
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)

        return await call_next(request)
