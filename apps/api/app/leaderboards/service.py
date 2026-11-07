"""Leaderboard service – Redis sorted set operations + display name enrichment."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.database import get_db
from app.redis_client import (
    _lb_alltime_key,
    _lb_daily_key,
    _lb_weekly_key,
    leaderboard_rank,
    leaderboard_top,
)


async def _enrich_entries(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Add display_name, username, avatar_url to leaderboard entries from Mongo."""
    if not entries:
        return entries
    db = get_db()
    user_ids = [e["user_id"] for e in entries]
    cursor = db.users.find({"_id": {"$in": user_ids}}, {"_id": 1, "display_name": 1, "username": 1, "avatar_url": 1})
    user_map: dict[str, dict] = {}
    async for u in cursor:
        user_map[str(u["_id"])] = u

    enriched = []
    for rank, entry in enumerate(entries, start=1):
        uid = entry["user_id"]
        u = user_map.get(uid, {})
        enriched.append({
            "rank": rank,
            "user_id": uid,
            "display_name": u.get("display_name"),
            "username": u.get("username"),
            "avatar_url": u.get("avatar_url"),
            "score": entry["score"],
        })
    return enriched


async def get_alltime_leaderboard(limit: int = 50, mode: str = "stats") -> dict[str, Any]:
    """Return the all-time leaderboard."""
    key = _lb_alltime_key(mode)
    entries = await leaderboard_top(key, 0, limit - 1)
    enriched = await _enrich_entries(entries)
    from app.redis_client import get_redis
    total = await get_redis().zcard(key)
    return {"period": "alltime", "mode": mode, "entries": enriched, "total_players": total}


async def get_daily_leaderboard(limit: int = 50, dt: datetime | None = None, mode: str = "stats") -> dict[str, Any]:
    """Return today's daily leaderboard."""
    key = _lb_daily_key(dt, mode)
    entries = await leaderboard_top(key, 0, limit - 1)
    enriched = await _enrich_entries(entries)
    from app.redis_client import get_redis
    total = await get_redis().zcard(key)
    return {"period": "daily", "mode": mode, "entries": enriched, "total_players": total}


async def get_weekly_leaderboard(limit: int = 50, dt: datetime | None = None, mode: str = "stats") -> dict[str, Any]:
    """Return this week's weekly leaderboard."""
    key = _lb_weekly_key(dt, mode)
    entries = await leaderboard_top(key, 0, limit - 1)
    enriched = await _enrich_entries(entries)
    from app.redis_client import get_redis
    total = await get_redis().zcard(key)
    return {"period": "weekly", "mode": mode, "entries": enriched, "total_players": total}


async def get_my_ranks(user_id: str, mode: str = "stats") -> dict[str, Any]:
    """Get the current user's rank across all three leaderboards."""
    db = get_db()
    user = await db.users.find_one({"_id": user_id}, {"display_name": 1, "username": 1, "avatar_url": 1})

    result: dict[str, Any] = {"alltime": None, "daily": None, "weekly": None}

    for period, key in [
        ("alltime", _lb_alltime_key(mode=mode)),
        ("daily", _lb_daily_key(mode=mode)),
        ("weekly", _lb_weekly_key(mode=mode)),
    ]:
        rank_data = await leaderboard_rank(key, user_id)
        if rank_data:
            result[period] = {
                "rank": rank_data["rank"],
                "user_id": user_id,
                "display_name": user.get("display_name") if user else None,
                "username": user.get("username") if user else None,
                "avatar_url": user.get("avatar_url") if user else None,
                "score": rank_data["score"],
            }

    return result
