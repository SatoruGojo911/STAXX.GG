"""Pokémon data service – queries against the pokemon collection."""

from __future__ import annotations

import re
from typing import Any

from app.database import get_db


async def get_pokemon_by_id(canonical_id: str) -> dict[str, Any] | None:
    """Fetch a single Pokémon by canonical_id."""
    db = get_db()
    doc = await db.pokemon.find_one({"canonical_id": canonical_id}, {"_id": 0})
    return doc


async def search_pokemon(query: str, limit: int = 20) -> list[dict[str, Any]]:
    """Search Pokémon by name or display_name."""
    db = get_db()
    escaped = re.escape(query.strip())
    cursor = db.pokemon.find(
        {
            "$or": [
                {"name": {"$regex": f"^{escaped}", "$options": "i"}},
                {"display_name": {"$regex": f"^{escaped}", "$options": "i"}},
                {"canonical_id": {"$regex": f"^{escaped}", "$options": "i"}},
            ]
        },
        {"_id": 0, "canonical_id": 1, "name": 1, "display_name": 1, "species_id": 1, "artwork_url": 1, "types": 1},
    ).limit(limit)
    return await cursor.to_list(length=limit)


async def get_pokemon_forms(species_or_pokedex_id: int) -> list[dict[str, Any]]:
    """Return all forms for a given species / Pokédex number."""
    db = get_db()
    cursor = db.pokemon.find(
        {
            "$or": [
                {"species_id": species_or_pokedex_id},
                {"pokeapi_id": species_or_pokedex_id},
            ]
        },
        {"_id": 0, "canonical_id": 1, "name": 1, "display_name": 1, "form_name": 1, "form_category": 1, "artwork_url": 1},
    )
    return await cursor.to_list(length=50)


async def get_pokemon_stats(canonical_id: str) -> dict[str, Any] | None:
    """Return full stats for a Pokémon."""
    db = get_db()
    doc = await db.pokemon.find_one(
        {"canonical_id": canonical_id},
        {"_id": 0, "canonical_id": 1, "name": 1, "display_name": 1, "stats": 1, "bst": 1, "height": 1, "height_m": 1, "weight": 1, "weight_kg": 1, "types": 1},
    )
    return doc


async def get_pokemon_count() -> int:
    """Return the total number of Pokémon in the database."""
    db = get_db()
    return await db.pokemon.count_documents({})
