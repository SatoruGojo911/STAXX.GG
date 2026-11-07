"""Players router – /api/v1/players endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.models.user import UserProfileUpdate
from app.players.service import (
    get_player_by_username,
    get_player_profile,
    get_player_stats,
    update_player_profile,
)

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/me")
async def players_me(current_user: dict = Depends(get_current_user)):
    """Get the current player's full profile."""
    profile = await get_player_profile(current_user["user_id"])
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return profile


@router.get("/me/stats")
async def players_me_stats(current_user: dict = Depends(get_current_user)):
    """Get the current player's stats."""
    stats = await get_player_stats(current_user["user_id"])
    if stats is None:
        return {
            "user_id": current_user["user_id"],
            "games_played": 0,
            "total_correct": 0,
            "total_incorrect": 0,
            "best_streak": 0,
            "best_streak_guesser": 0,
            "games_played_guesser": 0,
            "current_streak": 0,
            "average_streak": 0.0,
            "last_played": None,
        }
    return stats


@router.patch("/me")
async def players_me_update(
    body: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the current player's profile."""
    try:
        profile = await update_player_profile(
            current_user["user_id"],
            body.model_dump(exclude_unset=True),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return profile


@router.get("/{username}")
async def players_by_username(username: str):
    """Get a player's public profile by username."""
    profile = await get_player_by_username(username)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found.")
    # Redact email for public view
    if "email" in (profile.get("stats") or {}):
        del profile["stats"]["email"]
    return profile
