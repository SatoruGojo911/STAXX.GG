"""Pydantic v2 models for leaderboards."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LeaderboardEntry(BaseModel):
    """Single leaderboard row."""

    rank: int = Field(..., ge=1)
    user_id: str
    display_name: str | None = None
    username: str | None = None
    avatar_url: str | None = None
    score: int


class LeaderboardResponse(BaseModel):
    """Full leaderboard response."""

    period: str = Field(..., description="alltime | daily | weekly")
    entries: list[LeaderboardEntry] = Field(default_factory=list)
    total_players: int = 0


class MyRankResponse(BaseModel):
    """Current user's position across all leaderboards."""

    alltime: LeaderboardEntry | None = None
    daily: LeaderboardEntry | None = None
    weekly: LeaderboardEntry | None = None
