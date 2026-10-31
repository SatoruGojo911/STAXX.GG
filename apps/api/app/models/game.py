"""Pydantic v2 models for game sessions and rounds."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models.pokemon import PokemonPublic, PokemonWithStat


class GameRound(BaseModel):
    """A single round within a game session."""

    round_number: int = Field(..., ge=1)
    stat_category: str
    pokemon_a: PokemonWithStat
    pokemon_b: PokemonPublic
    player_answer: Literal["higher", "lower", "equal"] | None = None
    correct_answer: Literal["higher", "lower", "equal"] | None = None
    is_correct: bool | None = None
    pokemon_b_stat_value: float | None = None


class GameStartResponse(BaseModel):
    """Response returned when a new game is started."""

    game_id: str
    round_number: int
    stat_category: str
    pokemon_a: PokemonWithStat
    pokemon_b: PokemonPublic


class GuessRequest(BaseModel):
    """Body for POST /games/{id}/guess."""

    answer: Literal["higher", "lower", "equal"]


class GuessResponse(BaseModel):
    """Response returned after processing a guess."""

    game_id: str
    round_number: int
    correct_answer: Literal["higher", "lower", "equal"]
    player_answer: Literal["higher", "lower", "equal"]
    is_correct: bool
    pokemon_b_stat_value: float
    streak: int
    game_over: bool
    # Next round info (None if game_over)
    next_round: GameStartResponse | None = None


class GameSessionDoc(BaseModel):
    """Game session document stored in MongoDB."""

    id: str = Field(..., alias="_id")
    player_id: str
    status: Literal["active", "completed", "abandoned"] = "active"
    streak: int = 0
    rounds: list[dict[str, Any]] = Field(default_factory=list)
    started_at: datetime
    ended_at: datetime | None = None

    model_config = {"populate_by_name": True}


class GameHistoryEntry(BaseModel):
    """Summary entry for game history listing."""

    game_id: str
    streak: int
    status: str
    started_at: datetime
    ended_at: datetime | None = None


class GameResultResponse(BaseModel):
    """Full result of a completed game."""

    game_id: str
    player_id: str
    streak: int
    status: str
    rounds: list[GameRound] = Field(default_factory=list)
    started_at: datetime
    ended_at: datetime | None = None
