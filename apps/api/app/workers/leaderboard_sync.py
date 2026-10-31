"""Leaderboard reconciliation worker.

Periodically scans MongoDB player_stats to ensure the Redis sorted sets
are consistent. Useful after Redis restarts or data migrations.

Can be run standalone:  python -m app.workers.leaderboard_sync
Or triggered via an admin endpoint / cron job.
"""

from __future__ import annotations

import asyncio
import logging

from app.database import connect_db, close_db, get_db
from app.redis_client import connect_redis, close_redis, leaderboard_update

logger = logging.getLogger(__name__)


async def reconcile_leaderboards() -> int:
    """Read all player_stats from Mongo and upsert into Redis sorted sets.

    Returns the number of players processed.
    """
    db = get_db()
    cursor = db.player_stats.find({}, {"user_id": 1, "best_streak": 1})
    count = 0
    async for doc in cursor:
        user_id = doc["user_id"]
        best_streak = doc.get("best_streak", 0)
        if best_streak > 0:
            await leaderboard_update(user_id, best_streak)
            count += 1
    return count


async def run_sync() -> None:
    """Full lifecycle: connect → reconcile → disconnect."""
    await connect_db()
    await connect_redis()
    try:
        count = await reconcile_leaderboards()
        logger.info("Leaderboard sync complete – processed %d players.", count)
    finally:
        await close_redis()
        await close_db()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_sync())
