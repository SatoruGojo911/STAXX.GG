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


@router.get("/alltime")
async def leaderboard_alltime(limit: int = Query(50, ge=1, le=200)):
    """Get the all-time leaderboard."""
    return await get_alltime_leaderboard(limit=limit)


@router.get("/daily")
async def leaderboard_daily(limit: int = Query(50, ge=1, le=200)):
    """Get today's daily leaderboard."""
    return await get_daily_leaderboard(limit=limit)


@router.get("/weekly")
async def leaderboard_weekly(limit: int = Query(50, ge=1, le=200)):
    """Get this week's weekly leaderboard."""
    return await get_weekly_leaderboard(limit=limit)


@router.get("/me")
async def leaderboard_me(current_user: dict = Depends(get_current_user)):
    """Get the current user's rank in all leaderboards."""
    return await get_my_ranks(current_user["user_id"])
