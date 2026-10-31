"""Core game engine – stat categories, random selection, comparison logic."""

from __future__ import annotations

import secrets
from enum import Enum
from typing import Any, Literal


class StatCategory(str, Enum):
    """The 9 stat categories available for comparison."""

    HP = "hp"
    ATTACK = "attack"
    DEFENCE = "defence"
    SPECIAL_ATTACK = "special_attack"
    SPECIAL_DEFENCE = "special_defence"
    SPEED = "speed"
    BST = "bst"
    HEIGHT = "height"
    WEIGHT = "weight"


ALL_STAT_CATEGORIES: list[str] = [c.value for c in StatCategory]

STAT_LABELS: dict[str, str] = {
    "hp": "HP",
    "attack": "Attack",
    "defence": "Defence",
    "special_attack": "Special Attack",
    "special_defence": "Special Defence",
    "speed": "Speed",
    "bst": "Base Stat Total (BST)",
    "height": "Height",
    "weight": "Weight",
}

STAT_UNITS: dict[str, str] = {
    "hp": "",
    "attack": "",
    "defence": "",
    "special_attack": "",
    "special_defence": "",
    "speed": "",
    "bst": "",
    "height": "m",
    "weight": "kg",
}


def pick_random_category() -> str:
    """Cryptographically secure random stat category selection."""
    return secrets.choice(ALL_STAT_CATEGORIES)


def get_stat_value(pokemon: dict[str, Any], category: str) -> float:
    """Extract normalized numerical stat value for a given category.

    Height is returned in metres.
    Weight is returned in kilograms.
    BST is the total sum.
    Battle stats return their base value.
    """
    category = category.lower()

    if category == "height":
        if "height_m" in pokemon and pokemon["height_m"] is not None:
            return round(float(pokemon["height_m"]), 2)
        return round(float(pokemon.get("height", 0)) / 10.0, 2)

    if category == "weight":
        if "weight_kg" in pokemon and pokemon["weight_kg"] is not None:
            return round(float(pokemon["weight_kg"]), 2)
        return round(float(pokemon.get("weight", 0)) / 10.0, 2)

    if category == "bst":
        if "bst" in pokemon and pokemon["bst"] is not None:
            return float(pokemon["bst"])
        stats = pokemon.get("stats", {})
        return float(sum(stats.values())) if stats else 0.0

    stats = pokemon.get("stats", {})

    # Support British and American spellings
    if category in ("defence", "defense"):
        val = stats.get("defence", stats.get("defense", 0))
        return float(val)

    if category in ("special_defence", "special_defense"):
        val = stats.get("special_defence", stats.get("special_defense", 0))
        return float(val)

    val = stats.get(category, 0)
    return float(val)


def compare(value_a: float, value_b: float) -> Literal["higher", "lower", "equal"]:
    """Determine the correct answer given A (revealed) and B (hidden).

    Returns what Pokémon B is *relative to* Pokémon A:
      - "higher" if B > A
      - "lower"  if B < A
      - "equal"  if B == A
    """
    if value_b > value_a:
        return "higher"
    elif value_b < value_a:
        return "lower"
    else:
        return "equal"


def pick_random_pokemon(
    pokemon_list: list[dict[str, Any]], exclude_ids: set[str] | None = None
) -> dict[str, Any]:
    """Cryptographically secure random Pokémon selection.

    Excludes certain canonical IDs to avoid duplicates.
    """
    if exclude_ids:
        candidates = [p for p in pokemon_list if p.get("canonical_id") not in exclude_ids]
    else:
        candidates = pokemon_list

    if not candidates:
        candidates = pokemon_list

    idx = secrets.randbelow(len(candidates))
    return candidates[idx]


def build_pokemon_public(pokemon: dict[str, Any]) -> dict[str, Any]:
    """Strip a pokemon document to public-safe fields (NO hidden stat values)."""
    return {
        "canonical_id": pokemon.get("canonical_id"),
        "pokeapi_id": pokemon.get("pokeapi_id", pokemon.get("species_id", 0)),
        "species_id": pokemon.get("species_id"),
        "name": pokemon.get("name"),
        "display_name": pokemon.get("display_name", pokemon.get("name", "").capitalize()),
        "form_name": pokemon.get("form_name"),
        "form_category": pokemon.get("form_category", "default"),
        "types": pokemon.get("types", []),
        "sprite_url": pokemon.get("sprite_url"),
        "artwork_url": pokemon.get("artwork_url"),
        "generation": pokemon.get("generation", 1),
    }


def build_pokemon_with_stat(pokemon: dict[str, Any], category: str) -> dict[str, Any]:
    """Build public pokemon data plus the revealed stat value and display info."""
    data = build_pokemon_public(pokemon)
    data["stat_category"] = category
    data["stat_label"] = STAT_LABELS.get(category, category.title())
    data["stat_unit"] = STAT_UNITS.get(category, "")
    data["stat_value"] = get_stat_value(pokemon, category)
    return data
