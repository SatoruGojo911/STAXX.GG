"""Async MongoDB connection via Motor."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, IndexModel

from app.config import settings

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

# Module-level singletons – initialised in startup, torn down in shutdown.
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_db() -> AsyncIOMotorDatabase:
    """Return the database handle. Raises if not connected."""
    if _db is None:
        raise RuntimeError("MongoDB is not connected – call connect_db() first")
    return _db


async def connect_db() -> None:
    """Create the Motor client and ensure indexes exist."""
    global _client, _db  # noqa: PLW0603

    logger.info("Connecting to MongoDB …")
    _client = AsyncIOMotorClient(settings.MONGODB_URI)
    _db = _client[settings.MONGODB_DATABASE]

    # ---------- ensure indexes ----------
    await _ensure_indexes(_db)
    logger.info("MongoDB connected & indexes ensured.")


async def _ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create all required indexes (idempotent)."""
    try:
        # users
        await db.users.create_indexes(
            [
                IndexModel([("google_sub", ASCENDING)], unique=True, sparse=True),
                IndexModel([("username", ASCENDING)], unique=True, sparse=True),
                IndexModel([("session_token", ASCENDING)], sparse=True),
            ]
        )

        # pokemon
        await db.pokemon.create_indexes(
            [
                IndexModel([("canonical_id", ASCENDING)], unique=True),
                IndexModel([("name", ASCENDING)]),
                IndexModel([("species_id", ASCENDING)]),
            ]
        )

        # game_sessions
        await db.game_sessions.create_indexes(
            [
                IndexModel([("player_id", ASCENDING), ("started_at", DESCENDING)]),
                IndexModel([("status", ASCENDING)]),
            ]
        )

        # player_stats
        await db.player_stats.create_indexes(
            [
                IndexModel([("user_id", ASCENDING)], unique=True),
                IndexModel([("best_streak", DESCENDING)]),
            ]
        )
    except Exception as exc:
        logger.warning("Index creation note (indexes likely exist): %s", exc)


async def close_db() -> None:
    """Close the Motor client."""
    global _client, _db  # noqa: PLW0603

    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB disconnected.")
