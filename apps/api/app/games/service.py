"""Game service – orchestrates game sessions, persistence, and scoring."""

from __future__ import annotations

import uuid
import logging
from datetime import datetime, timezone
from typing import Any

from app.database import get_db
from app.games.engine import (
    build_pokemon_public,
    build_pokemon_with_stat,
    compare,
    get_stat_value,
    pick_random_category,
    pick_random_pokemon,
)
from app.redis_client import (
    delete_game_state,
    get_game_state,
    leaderboard_update,
    store_game_state,
)

logger = logging.getLogger(__name__)


async def _fetch_pokemon_pool() -> list[dict[str, Any]]:
    """Load the full Pokémon pool from MongoDB."""
    db = get_db()
    cursor = db.pokemon.find({}, {"_id": 0})
    return await cursor.to_list(length=2000)


async def start_game(player_id: str) -> dict[str, Any]:
    """Create a new game session, pick the first round, and return the start response."""
    pool = await _fetch_pokemon_pool()
    if len(pool) < 2:
        raise ValueError("Not enough Pokémon in the database to start a game (need ≥ 2).")

    game_id = str(uuid.uuid4())
    category = pick_random_category()
    pokemon_a = pick_random_pokemon(pool)
    pokemon_b = pick_random_pokemon(pool, exclude_ids={pokemon_a["canonical_id"]})

    now = datetime.now(timezone.utc)

    # Build internal state (stored in Redis – contains hidden values)
    game_state: dict[str, Any] = {
        "game_id": game_id,
        "player_id": player_id,
        "status": "active",
        "streak": 0,
        "round_number": 1,
        "current_category": category,
        "pokemon_a": pokemon_a,
        "pokemon_b": pokemon_b,
        "used_ids": [pokemon_a["canonical_id"], pokemon_b["canonical_id"]],
        "rounds_history": [],
        "started_at": now.isoformat(),
    }
    await store_game_state(game_id, game_state)

    # Persist skeleton in MongoDB
    db = get_db()
    await db.game_sessions.insert_one({
        "_id": game_id,
        "player_id": player_id,
        "status": "active",
        "streak": 0,
        "rounds": [],
        "started_at": now,
        "ended_at": None,
    })

    # Build safe response (never expose pokemon_b stat value)
    return {
        "game_id": game_id,
        "round_number": 1,
        "stat_category": category,
        "pokemon_a": build_pokemon_with_stat(pokemon_a, category),
        "pokemon_b": build_pokemon_public(pokemon_b),
    }


async def process_guess(game_id: str, player_id: str, answer: str) -> dict[str, Any]:
    """Process a player's guess for the current round.

    Returns the guess response including result and next round (or game over).
    """
    state = await get_game_state(game_id)
    if state is None:
        raise ValueError("Game not found or expired.")
    if state["player_id"] != player_id:
        raise PermissionError("This game does not belong to you.")
    if state["status"] != "active":
        raise ValueError("This game is no longer active.")

    category = state["current_category"]
    pokemon_a = state["pokemon_a"]
    pokemon_b = state["pokemon_b"]
    round_number = state["round_number"]

    value_a = get_stat_value(pokemon_a, category)
    value_b = get_stat_value(pokemon_b, category)
    correct_answer = compare(value_a, value_b)
    is_correct = answer == correct_answer

    # Record round in history
    round_record = {
        "round_number": round_number,
        "stat_category": category,
        "pokemon_a_id": pokemon_a["canonical_id"],
        "pokemon_b_id": pokemon_b["canonical_id"],
        "pokemon_a_stat_value": value_a,
        "pokemon_b_stat_value": value_b,
        "player_answer": answer,
        "correct_answer": correct_answer,
        "is_correct": is_correct,
    }
    state["rounds_history"].append(round_record)

    db = get_db()

    if is_correct:
        state["streak"] += 1
        streak = state["streak"]

        # Set up next round: B becomes the new A, pick fresh B + category
        pool = await _fetch_pokemon_pool()
        used = set(state["used_ids"])
        new_category = pick_random_category()
        new_pokemon_b = pick_random_pokemon(pool, exclude_ids=used)
        state["used_ids"].append(new_pokemon_b["canonical_id"])

        state["round_number"] = round_number + 1
        state["current_category"] = new_category
        state["pokemon_a"] = pokemon_b  # old B becomes new A
        state["pokemon_b"] = new_pokemon_b

        await store_game_state(game_id, state)

        # Update Mongo streak
        await db.game_sessions.update_one(
            {"_id": game_id},
            {
                "$set": {"streak": streak},
                "$push": {"rounds": round_record},
            },
        )

        next_round = {
            "game_id": game_id,
            "round_number": round_number + 1,
            "stat_category": new_category,
            "pokemon_a": build_pokemon_with_stat(pokemon_b, new_category),
            "pokemon_b": build_pokemon_public(new_pokemon_b),
        }

        return {
            "game_id": game_id,
            "round_number": round_number,
            "correct_answer": correct_answer,
            "player_answer": answer,
            "is_correct": True,
            "pokemon_b_stat_value": value_b,
            "streak": streak,
            "game_over": False,
            "next_round": next_round,
        }
    else:
        # Game over
        streak = state["streak"]
        state["status"] = "completed"
        now = datetime.now(timezone.utc)

        await delete_game_state(game_id)

        await db.game_sessions.update_one(
            {"_id": game_id},
            {
                "$set": {
                    "status": "completed",
                    "streak": streak,
                    "ended_at": now,
                },
                "$push": {"rounds": round_record},
            },
        )

        # Update player stats
        await _update_player_stats(player_id, streak, is_win=False)

        # Update leaderboards
        await leaderboard_update(player_id, streak)

        return {
            "game_id": game_id,
            "round_number": round_number,
            "correct_answer": correct_answer,
            "player_answer": answer,
            "is_correct": False,
            "pokemon_b_stat_value": value_b,
            "streak": streak,
            "game_over": True,
            "next_round": None,
        }


async def abandon_game(game_id: str, player_id: str) -> dict[str, Any]:
    """Abandon an active game."""
    state = await get_game_state(game_id)
    if state is None:
        # Try from Mongo
        db = get_db()
        doc = await db.game_sessions.find_one({"_id": game_id})
        if doc is None:
            raise ValueError("Game not found.")
        if str(doc["player_id"]) != player_id:
            raise PermissionError("This game does not belong to you.")
        if doc["status"] != "active":
            raise ValueError("This game is no longer active.")
        streak = doc.get("streak", 0)
    else:
        if state["player_id"] != player_id:
            raise PermissionError("This game does not belong to you.")
        if state["status"] != "active":
            raise ValueError("This game is no longer active.")
        streak = state["streak"]
        await delete_game_state(game_id)

    db = get_db()
    now = datetime.now(timezone.utc)
    await db.game_sessions.update_one(
        {"_id": game_id},
        {"$set": {"status": "abandoned", "ended_at": now}},
    )

    await _update_player_stats(player_id, streak, is_win=False)

    return {"game_id": game_id, "status": "abandoned", "final_streak": streak}


async def get_game(game_id: str, player_id: str) -> dict[str, Any]:
    """Get the current state of a game (safe – no hidden values)."""
    # Try Redis first for active games
    state = await get_game_state(game_id)
    if state is not None:
        if state["player_id"] != player_id:
            raise PermissionError("This game does not belong to you.")
        return {
            "game_id": state["game_id"],
            "round_number": state["round_number"],
            "stat_category": state["current_category"],
            "pokemon_a": build_pokemon_with_stat(state["pokemon_a"], state["current_category"]),
            "pokemon_b": build_pokemon_public(state["pokemon_b"]),
        }

    # Fall back to MongoDB for completed/abandoned games
    db = get_db()
    doc = await db.game_sessions.find_one({"_id": game_id})
    if doc is None:
        raise ValueError("Game not found.")
    if str(doc["player_id"]) != player_id:
        raise PermissionError("This game does not belong to you.")

    return {
        "game_id": str(doc["_id"]),
        "status": doc["status"],
        "streak": doc["streak"],
        "started_at": doc["started_at"].isoformat() if doc.get("started_at") else None,
        "ended_at": doc["ended_at"].isoformat() if doc.get("ended_at") else None,
    }


async def get_game_result(game_id: str, player_id: str) -> dict[str, Any]:
    """Get the full result of a completed game."""
    db = get_db()
    doc = await db.game_sessions.find_one({"_id": game_id})
    if doc is None:
        raise ValueError("Game not found.")
    if str(doc["player_id"]) != player_id:
        raise PermissionError("This game does not belong to you.")
    if doc["status"] == "active":
        raise ValueError("Game is still active – cannot view result yet.")

    return {
        "game_id": str(doc["_id"]),
        "player_id": str(doc["player_id"]),
        "streak": doc["streak"],
        "status": doc["status"],
        "rounds": doc.get("rounds", []),
        "started_at": doc["started_at"].isoformat() if doc.get("started_at") else None,
        "ended_at": doc["ended_at"].isoformat() if doc.get("ended_at") else None,
    }


async def get_game_history(player_id: str, limit: int = 20, skip: int = 0) -> list[dict[str, Any]]:
    """Return recent game history for a player."""
    db = get_db()
    cursor = (
        db.game_sessions.find(
            {"player_id": player_id},
            {"_id": 1, "streak": 1, "status": 1, "started_at": 1, "ended_at": 1},
        )
        .sort("started_at", -1)
        .skip(skip)
        .limit(limit)
    )
    results = []
    async for doc in cursor:
        results.append({
            "game_id": str(doc["_id"]),
            "streak": doc.get("streak", 0),
            "status": doc.get("status", "unknown"),
            "started_at": doc["started_at"].isoformat() if doc.get("started_at") else None,
            "ended_at": doc["ended_at"].isoformat() if doc.get("ended_at") else None,
        })
    return results


async def _update_player_stats(player_id: str, streak: int, *, is_win: bool) -> None:
    """Update player statistics after a game ends."""
    db = get_db()
    now = datetime.now(timezone.utc)

    stats = await db.player_stats.find_one({"user_id": player_id})
    if stats is None:
        games_played = 1
        total_correct = streak
        total_incorrect = 0 if is_win else 1
        best_streak = streak
        average_streak = float(streak)
    else:
        games_played = stats.get("games_played", 0) + 1
        total_correct = stats.get("total_correct", 0) + streak
        total_incorrect = stats.get("total_incorrect", 0) + (0 if is_win else 1)
        best_streak = max(stats.get("best_streak", 0), streak)
        prev_avg = stats.get("average_streak", 0.0)
        prev_games = stats.get("games_played", 0)
        average_streak = (prev_avg * prev_games + streak) / games_played if games_played > 0 else 0.0

    await db.player_stats.update_one(
        {"user_id": player_id},
        {
            "$set": {
                "games_played": games_played,
                "total_correct": total_correct,
                "total_incorrect": total_incorrect,
                "best_streak": best_streak,
                "current_streak": streak,
                "average_streak": round(average_streak, 2),
                "last_played": now,
            },
            "$setOnInsert": {"user_id": player_id},
        },
        upsert=True,
    )
