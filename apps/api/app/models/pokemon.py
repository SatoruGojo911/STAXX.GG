"""Pydantic v2 models for Pokémon data."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PokemonStats(BaseModel):
    """Base stats for a Pokémon."""

    hp: int = Field(..., ge=0)
    attack: int = Field(..., ge=0)
    defence: int = Field(..., ge=0)
    special_attack: int = Field(..., ge=0)
    special_defence: int = Field(..., ge=0)
    speed: int = Field(..., ge=0)
    bst: int = Field(..., ge=0, description="Base Stat Total")


class PokemonDoc(BaseModel):
    """Full Pokémon document as stored in MongoDB."""

    canonical_id: str = Field(..., description="Unique slug, e.g. 'pikachu', 'charizard-mega-x'")
    pokedex_number: int
    name: str
    form_name: str | None = None
    generation: int | None = None
    types: list[str] = Field(default_factory=list)
    abilities: list[str] = Field(default_factory=list)
    stats: PokemonStats
    height: float = Field(..., ge=0, description="Height in metres")
    weight: float = Field(..., ge=0, description="Weight in kg")
    sprite_url: str | None = None
    artwork_url: str | None = None
    is_default: bool = True


class PokemonPublic(BaseModel):
    """Pokémon data sent to the client (safe – no hidden value leak)."""

    canonical_id: str
    pokedex_number: int
    name: str
    form_name: str | None = None
    types: list[str] = Field(default_factory=list)
    sprite_url: str | None = None
    artwork_url: str | None = None
    generation: int | None = None
    is_default: bool = True


class PokemonWithStat(PokemonPublic):
    """Pokémon with a single revealed stat value (for the 'known' card)."""

    stat_category: str
    stat_value: float


class PokemonSearchResult(BaseModel):
    """Lightweight search result."""

    canonical_id: str
    name: str
    pokedex_number: int
    artwork_url: str | None = None


class PokemonFormEntry(BaseModel):
    """Entry for form listing."""

    canonical_id: str
    name: str
    form_name: str | None = None
    artwork_url: str | None = None


class PokemonStatsResponse(BaseModel):
    """Full stats response for an individual Pokémon."""

    canonical_id: str
    name: str
    stats: PokemonStats
    height: float
    weight: float
    types: list[str] = Field(default_factory=list)
