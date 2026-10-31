"""Async Redis connection and helper utilities."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

_pool: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    """Return the global Redis connection. Raises if not connected."""
    if _pool is None:
        raise RuntimeError("Redis is not connected – call connect_redis() first")
    return _pool


async def connect_redis() -> None:
    """Create the Redis connection pool."""
    global _pool  # noqa: PLW0603
    logger.info("Connecting to Redis …")
    _pool = aioredis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        max_connections=20,
    )
    # Quick health-check
    await _pool.ping()
    logger.info("Redis connected.")


async def close_redis() -> None:
    """Close the Redis pool."""
    global _pool  # noqa: PLW0603
    if _pool is not None:
        await _pool.aclose()
        _pool = None
        logger.info("Redis disconnected.")


# ---------------------------------------------------------------------------
# Game state helpers
# ---------------------------------------------------------------------------

GAME_TTL = 3600  # 1 hour


def _game_key(game_id: str) -> str:
    return f"game:{game_id}"


async def store_game_state(game_id: str, state: dict[str, Any]) -> None:
    """Persist game state to Redis with TTL."""
    r = get_redis()
    await r.set(_game_key(game_id), json.dumps(state, default=str), ex=GAME_TTL)


async def get_game_state(game_id: str) -> dict[str, Any] | None:
    """Retrieve game state from Redis."""
    r = get_redis()
    raw = await r.get(_game_key(game_id))
    if raw is None:
        return None
    return json.loads(raw)


async def delete_game_state(game_id: str) -> None:
    """Remove game state from Redis."""
    r = get_redis()
    await r.delete(_game_key(game_id))


# ---------------------------------------------------------------------------
# Session helpers
# ---------------------------------------------------------------------------

SESSION_TTL = 86400 * 7  # 7 days


def _session_key(token: str) -> str:
    return f"session:{token}"


async def store_session(token: str, data: dict[str, Any]) -> None:
    """Store session data in Redis."""
    r = get_redis()
    await r.set(_session_key(token), json.dumps(data, default=str), ex=SESSION_TTL)


async def get_session(token: str) -> dict[str, Any] | None:
    """Retrieve session data from Redis."""
    r = get_redis()
    raw = await r.get(_session_key(token))
    if raw is None:
        return None
    return json.loads(raw)


async def delete_session(token: str) -> None:
    """Remove session from Redis."""
    r = get_redis()
    await r.delete(_session_key(token))


# ---------------------------------------------------------------------------
# Leaderboard helpers
# ---------------------------------------------------------------------------

def _lb_alltime_key() -> str:
    return "leaderboard:alltime"


def _lb_daily_key(dt: datetime | None = None) -> str:
    dt = dt or datetime.now(timezone.utc)
    return f"leaderboard:daily:{dt.strftime('%Y-%m-%d')}"


def _lb_weekly_key(dt: datetime | None = None) -> str:
    dt = dt or datetime.now(timezone.utc)
    iso = dt.isocalendar()
    return f"leaderboard:weekly:{iso.year}-W{iso.week:02d}"


async def leaderboard_update(user_id: str, score: int) -> None:
    """Update all three leaderboard sorted sets (only if score is better)."""
    r = get_redis()
    now = datetime.now(timezone.utc)
    for key in (_lb_alltime_key(), _lb_daily_key(now), _lb_weekly_key(now)):
        current = await r.zscore(key, user_id)
        if current is None or score > current:
            await r.zadd(key, {user_id: score})
    # Expire daily/weekly keys so they self-clean
    await r.expire(_lb_daily_key(now), 86400 * 2)
    await r.expire(_lb_weekly_key(now), 86400 * 8)


async def leaderboard_top(key: str, start: int = 0, stop: int = 9) -> list[dict[str, Any]]:
    """Return top entries from a leaderboard sorted set."""
    r = get_redis()
    entries = await r.zrevrange(key, start, stop, withscores=True)
    return [{"user_id": uid, "score": int(score)} for uid, score in entries]


async def leaderboard_rank(key: str, user_id: str) -> dict[str, Any] | None:
    """Return rank + score for a user in a leaderboard."""
    r = get_redis()
    rank = await r.zrevrank(key, user_id)
    if rank is None:
        return None
    score = await r.zscore(key, user_id)
    return {"user_id": user_id, "rank": rank + 1, "score": int(score)}
