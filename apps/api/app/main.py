"""STAXX.GG – FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import close_db, connect_db
from app.redis_client import close_redis, connect_redis
from app.security.middleware import CSRFMiddleware, RateLimitMiddleware, RequestIDMiddleware

# Routers
from app.auth.router import router as auth_router
from app.games.router import router as games_router
from app.players.router import router as players_router
from app.leaderboards.router import router as leaderboards_router
from app.pokemon.router import router as pokemon_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan – startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: connect and disconnect resources."""
    logger.info("Starting STAXX.GG API (env=%s) …", settings.ENVIRONMENT)
    await connect_db()
    await connect_redis()
    logger.info("All resources connected.")
    yield
    logger.info("Shutting down …")
    await close_redis()
    await close_db()
    logger.info("Shutdown complete.")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="STAXX.GG API",
    description="Pokémon Higher or Lower game platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
)

# ---------------------------------------------------------------------------
# Middleware (order matters – outermost first)
# ---------------------------------------------------------------------------

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# Request ID
app.add_middleware(RequestIDMiddleware)

# Rate limiting (100 req/min per IP – adjust for prod)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)

# CSRF
app.add_middleware(CSRFMiddleware)

# ---------------------------------------------------------------------------
# Routers – all under /api/v1
# ---------------------------------------------------------------------------

API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(games_router, prefix=API_PREFIX)
app.include_router(players_router, prefix=API_PREFIX)
app.include_router(leaderboards_router, prefix=API_PREFIX)
app.include_router(pokemon_router, prefix=API_PREFIX)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler to guarantee JSON error responses."""
    request_id = getattr(request.state, "request_id", "unknown")
    logger.exception("Unhandled error [request_id=%s]: %s", request_id, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error.", "request_id": request_id},
    )


# ---------------------------------------------------------------------------
# Health & readiness checks
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"])
@app.get("/api/v1/health", tags=["health"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "environment": settings.ENVIRONMENT}


@app.get("/ready", tags=["health"])
@app.get("/api/v1/ready", tags=["health"])
async def ready_check():
    """Readiness probe checking database and cache connectivity."""
    mongo_status = "error"
    redis_status = "error"
    try:
        from app.database import get_db
        db = get_db()
        await db.command("ping")
        mongo_status = "connected"
    except Exception as e:
        mongo_status = f"unhealthy: {e}"

    try:
        from app.redis_client import get_redis
        r = get_redis()
        await r.ping()
        redis_status = "connected"
    except Exception as e:
        redis_status = f"unhealthy: {e}"

    is_ready = mongo_status == "connected" and redis_status == "connected"
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if is_ready else "not_ready",
            "mongodb": mongo_status,
            "redis": redis_status,
        },
    )
