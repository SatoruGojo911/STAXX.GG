"""Player service – profile and stats queries."""

from __future__ import annotations

from typing import Any

from app.database import get_db


async def get_player_profile(user_id: str) -> dict[str, Any] | None:
    """Fetch user profile + stats for a user ID."""
    db = get_db()
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        return None

    stats = await db.player_stats.find_one({"user_id": user_id})

    profile: dict[str, Any] = {
        "id": str(user["_id"]),
        "display_name": user.get("display_name", "Unknown"),
        "username": user.get("username"),
        "avatar_url": user.get("avatar_url"),
        "account_type": user.get("account_type", "guest"),
    }

    if stats:
        profile["stats"] = {
            "user_id": stats["user_id"],
            "games_played": stats.get("games_played", 0),
            "total_correct": stats.get("total_correct", 0),
            "total_incorrect": stats.get("total_incorrect", 0),
            "best_streak": stats.get("best_streak", 0),
            "current_streak": stats.get("current_streak", 0),
            "average_streak": stats.get("average_streak", 0.0),
            "last_played": stats.get("last_played"),
        }
    else:
        profile["stats"] = None

    return profile


async def get_player_by_username(username: str) -> dict[str, Any] | None:
    """Fetch player profile by username."""
    db = get_db()
    user = await db.users.find_one({"username": username})
    if user is None:
        return None
    return await get_player_profile(str(user["_id"]))


async def get_player_stats(user_id: str) -> dict[str, Any] | None:
    """Fetch just the stats for a user."""
    db = get_db()
    stats = await db.player_stats.find_one({"user_id": user_id})
    if stats is None:
        return None
    return {
        "user_id": stats["user_id"],
        "games_played": stats.get("games_played", 0),
        "total_correct": stats.get("total_correct", 0),
        "total_incorrect": stats.get("total_incorrect", 0),
        "best_streak": stats.get("best_streak", 0),
        "current_streak": stats.get("current_streak", 0),
        "average_streak": stats.get("average_streak", 0.0),
        "last_played": stats.get("last_played"),
    }


async def update_player_profile(user_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    """Update mutable profile fields (display_name, username)."""
    db = get_db()

    # Filter to only allowed fields
    allowed = {"display_name", "username"}
    safe_updates = {k: v for k, v in updates.items() if k in allowed and v is not None}
    if not safe_updates:
        return await get_player_profile(user_id)

    # Check username uniqueness if changing
    if "username" in safe_updates:
        existing = await db.users.find_one({
            "username": safe_updates["username"],
            "_id": {"$ne": user_id},
        })
        if existing:
            raise ValueError("Username is already taken.")

    from datetime import datetime, timezone
    safe_updates["updated_at"] = datetime.now(timezone.utc)

    await db.users.update_one({"_id": user_id}, {"$set": safe_updates})
    return await get_player_profile(user_id)
