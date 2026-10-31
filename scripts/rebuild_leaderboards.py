#!/usr/bin/env python3
"""
STAXX.GG — Rebuild Leaderboards
=================================
Rebuilds Redis leaderboards from MongoDB player_stats data.

Reconstructs:
- All-time leaderboard
- Current daily leaderboard
- Current weekly leaderboard

Usage:
    python rebuild_leaderboards.py
    python rebuild_leaderboards.py --verbose
    python rebuild_leaderboards.py --dry-run
"""

import argparse
import asyncio
import logging
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

import redis.asyncio as aioredis
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/staxx")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "staxx")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

PLAYER_STATS_COLLECTION = "player_stats"
GAME_SESSIONS_COLLECTION = "game_sessions"

# Redis key patterns
LEADERBOARD_ALLTIME = "leaderboard:alltime"
LEADERBOARD_DAILY_PREFIX = "leaderboard:daily:"
LEADERBOARD_WEEKLY_PREFIX = "leaderboard:weekly:"

logger = logging.getLogger("staxx.leaderboards")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_daily_key() -> str:
    """Get Redis key for today's daily leaderboard."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"{LEADERBOARD_DAILY_PREFIX}{today}"


def get_weekly_key() -> str:
    """Get Redis key for the current week's leaderboard (ISO week)."""
    now = datetime.now(timezone.utc)
    year, week, _ = now.isocalendar()
    return f"{LEADERBOARD_WEEKLY_PREFIX}{year}-W{week:02d}"


def get_today_start() -> datetime:
    """Get the start of today (UTC)."""
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def get_week_start() -> datetime:
    """Get the start of the current ISO week (Monday, UTC)."""
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=now.weekday())
    return start.replace(hour=0, minute=0, second=0, microsecond=0)


# ---------------------------------------------------------------------------
# Rebuilder
# ---------------------------------------------------------------------------

class LeaderboardRebuilder:
    """Rebuilds all leaderboards from MongoDB data."""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.alltime_count = 0
        self.daily_count = 0
        self.weekly_count = 0
        self.errors: list[str] = []

    async def run(self) -> None:
        mongo_client = AsyncIOMotorClient(MONGODB_URI)
        db = mongo_client[MONGODB_DATABASE]

        redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)

        try:
            # Test connections
            await db.command("ping")
            logger.info("MongoDB connected")
            await redis_client.ping()
            logger.info("Redis connected")

            # Rebuild each leaderboard
            await self._rebuild_alltime(db, redis_client)
            await self._rebuild_daily(db, redis_client)
            await self._rebuild_weekly(db, redis_client)

        except Exception as exc:
            logger.error("Fatal error during rebuild: %s", exc)
            self.errors.append(str(exc))
            raise
        finally:
            mongo_client.close()
            await redis_client.aclose()

        self._print_report()

    async def _rebuild_alltime(
        self,
        db: object,
        redis_client: aioredis.Redis,
    ) -> None:
        """Rebuild all-time leaderboard from player_stats."""
        logger.info("Rebuilding all-time leaderboard...")
        collection = db[PLAYER_STATS_COLLECTION]  # type: ignore[index]

        count = await collection.count_documents({})
        if count == 0:
            logger.warning("No player_stats documents found. Skipping all-time leaderboard.")
            return

        key = LEADERBOARD_ALLTIME

        if not self.dry_run:
            # Remove existing leaderboard
            await redis_client.delete(key)

        cursor = collection.find(
            {},
            {"user_id": 1, "best_score": 1, "total_games": 1},
        )

        batch: list[tuple[float, str]] = []
        processed = 0

        async for doc in cursor:
            user_id = str(doc.get("user_id", ""))
            best_score = doc.get("best_score", 0)

            if not user_id:
                continue

            batch.append((float(best_score), user_id))
            processed += 1

            if len(batch) >= 500:
                if not self.dry_run:
                    await redis_client.zadd(key, {uid: score for score, uid in batch})
                batch.clear()

        # Flush remainder
        if batch and not self.dry_run:
            await redis_client.zadd(key, {uid: score for score, uid in batch})

        self.alltime_count = processed
        logger.info("All-time leaderboard: %d entries", processed)

    async def _rebuild_daily(
        self,
        db: object,
        redis_client: aioredis.Redis,
    ) -> None:
        """Rebuild today's daily leaderboard from game_sessions."""
        logger.info("Rebuilding daily leaderboard...")
        collection = db[GAME_SESSIONS_COLLECTION]  # type: ignore[index]

        today_start = get_today_start()
        key = get_daily_key()

        if not self.dry_run:
            await redis_client.delete(key)

        # Aggregate best scores per user for today
        pipeline = [
            {
                "$match": {
                    "status": "completed",
                    "completed_at": {"$gte": today_start},
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "best_score": {"$max": "$score"},
                }
            },
        ]

        batch: list[tuple[float, str]] = []
        processed = 0

        async for doc in collection.aggregate(pipeline):
            user_id = str(doc["_id"])
            best_score = doc.get("best_score", 0)

            if not user_id or best_score is None:
                continue

            batch.append((float(best_score), user_id))
            processed += 1

            if len(batch) >= 500:
                if not self.dry_run:
                    await redis_client.zadd(key, {uid: score for score, uid in batch})
                batch.clear()

        if batch and not self.dry_run:
            await redis_client.zadd(key, {uid: score for score, uid in batch})

        # Set TTL: expire at end of day + 1 hour buffer
        if not self.dry_run and processed > 0:
            tomorrow_start = today_start + timedelta(days=1, hours=1)
            ttl = int((tomorrow_start - datetime.now(timezone.utc)).total_seconds())
            if ttl > 0:
                await redis_client.expire(key, ttl)

        self.daily_count = processed
        logger.info("Daily leaderboard (%s): %d entries", key, processed)

    async def _rebuild_weekly(
        self,
        db: object,
        redis_client: aioredis.Redis,
    ) -> None:
        """Rebuild current week's leaderboard from game_sessions."""
        logger.info("Rebuilding weekly leaderboard...")
        collection = db[GAME_SESSIONS_COLLECTION]  # type: ignore[index]

        week_start = get_week_start()
        key = get_weekly_key()

        if not self.dry_run:
            await redis_client.delete(key)

        pipeline = [
            {
                "$match": {
                    "status": "completed",
                    "completed_at": {"$gte": week_start},
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "best_score": {"$max": "$score"},
                }
            },
        ]

        batch: list[tuple[float, str]] = []
        processed = 0

        async for doc in collection.aggregate(pipeline):
            user_id = str(doc["_id"])
            best_score = doc.get("best_score", 0)

            if not user_id or best_score is None:
                continue

            batch.append((float(best_score), user_id))
            processed += 1

            if len(batch) >= 500:
                if not self.dry_run:
                    await redis_client.zadd(key, {uid: score for score, uid in batch})
                batch.clear()

        if batch and not self.dry_run:
            await redis_client.zadd(key, {uid: score for score, uid in batch})

        # Set TTL: expire at end of week + 1 hour buffer
        if not self.dry_run and processed > 0:
            next_week_start = week_start + timedelta(days=7, hours=1)
            ttl = int((next_week_start - datetime.now(timezone.utc)).total_seconds())
            if ttl > 0:
                await redis_client.expire(key, ttl)

        self.weekly_count = processed
        logger.info("Weekly leaderboard (%s): %d entries", key, processed)

    def _print_report(self) -> None:
        status = "DRY RUN" if self.dry_run else "COMPLETE"
        print("\n" + "=" * 60)
        print("  STAXX.GG — Leaderboard Rebuild Report")
        print("=" * 60)
        print(f"  Status:               {status}")
        print(f"  All-time entries:     {self.alltime_count}")
        print(f"  Daily entries:        {self.daily_count}  ({get_daily_key()})")
        print(f"  Weekly entries:       {self.weekly_count}  ({get_weekly_key()})")
        print(f"  Errors:               {len(self.errors)}")
        if self.errors:
            for err in self.errors:
                print(f"    - {err}")
        print("=" * 60 + "\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="STAXX.GG — Rebuild Redis leaderboards from MongoDB",
    )
    parser.add_argument("--verbose", action="store_true", help="Enable debug logging")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Read data but don't write to Redis",
    )
    args = parser.parse_args()

    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    rebuilder = LeaderboardRebuilder(dry_run=args.dry_run)
    asyncio.run(rebuilder.run())


if __name__ == "__main__":
    main()
