"""Leaderboards router – /api/v1/leaderboards endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.leaderboards.service import (
    get_alltime_leaderboard,
    get_daily_leaderboard,
    get_my_ranks,
    get_weekly_leaderboard,
)

router = APIRouter(prefix="/leaderboards", tags=["leaderboards"])


def _normalize_mode(mode: str) -> str:
    return "guesser" if mode in ("abilities", "guesser") else "stats"


@router.get("/alltime")
async def leaderboard_alltime(
    limit: int = Query(50, ge=1, le=200),
    mode: str = Query("stats", pattern="^(stats|abilities|guesser)$"),
):
    """Get the all-time leaderboard for stats or guesser mode."""
    norm_mode = _normalize_mode(mode)
    return await get_alltime_leaderboard(limit=limit, mode=norm_mode)


@router.get("/daily")
async def leaderboard_daily(
    limit: int = Query(50, ge=1, le=200),
    mode: str = Query("stats", pattern="^(stats|abilities|guesser)$"),
):
    """Get today's daily leaderboard for stats or guesser mode."""
    norm_mode = _normalize_mode(mode)
    return await get_daily_leaderboard(limit=limit, mode=norm_mode)


@router.get("/weekly")
async def leaderboard_weekly(
    limit: int = Query(50, ge=1, le=200),
    mode: str = Query("stats", pattern="^(stats|abilities|guesser)$"),
):
    """Get this week's weekly leaderboard for stats or guesser mode."""
    norm_mode = _normalize_mode(mode)
    return await get_weekly_leaderboard(limit=limit, mode=norm_mode)


@router.get("/me")
async def leaderboard_me(
    mode: str = Query("stats", pattern="^(stats|abilities|guesser)$"),
    current_user: dict = Depends(get_current_user),
):
    """Get the current user's rank in all leaderboards for stats or guesser mode."""
    norm_mode = _normalize_mode(mode)
    return await get_my_ranks(current_user["user_id"], mode=norm_mode)
