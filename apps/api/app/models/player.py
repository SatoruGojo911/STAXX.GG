"""Pydantic v2 models for player statistics."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class PlayerStatsDoc(BaseModel):
    """Player stats document stored in MongoDB."""

    user_id: str
    games_played: int = 0
    total_correct: int = 0
    total_incorrect: int = 0
    best_streak: int = 0
    current_streak: int = 0
    average_streak: float = 0.0
    last_played: datetime | None = None


class PlayerStatsPublic(BaseModel):
    """Public-facing player statistics."""

    user_id: str
    display_name: str | None = None
    username: str | None = None
    avatar_url: str | None = None
    games_played: int = 0
    total_correct: int = 0
    total_incorrect: int = 0
    best_streak: int = 0
    current_streak: int = 0
    average_streak: float = 0.0
    last_played: datetime | None = None


class PlayerProfile(BaseModel):
    """Combined profile + stats for a player."""

    id: str
    display_name: str
    username: str | None = None
    avatar_url: str | None = None
    account_type: str = "guest"
    stats: PlayerStatsPublic | None = None
