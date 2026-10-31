"""Unit tests for the STAXX game engine."""

import pytest
from app.games.engine import (
    ALL_STAT_CATEGORIES,
    StatCategory,
    build_pokemon_public,
    build_pokemon_with_stat,
    compare,
    get_stat_value,
    pick_random_category,
    pick_random_pokemon,
)

SAMPLE_POKEMON_A = {
    "canonical_id": "charizard",
    "pokeapi_id": 6,
    "species_id": 6,
    "name": "charizard",
    "display_name": "Charizard",
    "types": ["fire", "flying"],
    "stats": {
        "hp": 78,
        "attack": 84,
        "defence": 78,
        "special_attack": 109,
        "special_defense": 85,
        "speed": 100,
    },
    "bst": 534,
    "height": 17,
    "height_m": 1.7,
    "weight": 905,
    "weight_kg": 90.5,
    "artwork_url": "https://example.com/charizard.png",
    "sprite_url": "https://example.com/charizard-sprite.png",
}

SAMPLE_POKEMON_B = {
    "canonical_id": "blastoise",
    "pokeapi_id": 9,
    "species_id": 9,
    "name": "blastoise",
    "display_name": "Blastoise",
    "types": ["water"],
    "stats": {
        "hp": 79,
        "attack": 83,
        "defence": 100,
        "special_attack": 85,
        "special_defense": 105,
        "speed": 78,
    },
    "bst": 530,
    "height": 16,
    "height_m": 1.6,
    "weight": 855,
    "weight_kg": 85.5,
    "artwork_url": "https://example.com/blastoise.png",
    "sprite_url": "https://example.com/blastoise-sprite.png",
}


def test_stat_categories_count():
    """Ensure all 9 required stat categories are defined."""
    assert len(ALL_STAT_CATEGORIES) == 9
    expected = {"hp", "attack", "defence", "special_attack", "special_defence", "speed", "bst", "height", "weight"}
    assert set(ALL_STAT_CATEGORIES) == expected


def test_pick_random_category():
    """Ensure pick_random_category returns a valid category."""
    for _ in range(50):
        cat = pick_random_category()
        assert cat in ALL_STAT_CATEGORIES


def test_get_stat_values_all_categories():
    """Verify stat extraction across all 9 categories."""
    assert get_stat_value(SAMPLE_POKEMON_A, "hp") == 78.0
    assert get_stat_value(SAMPLE_POKEMON_A, "attack") == 84.0
    assert get_stat_value(SAMPLE_POKEMON_A, "defence") == 78.0
    assert get_stat_value(SAMPLE_POKEMON_A, "special_attack") == 109.0
    assert get_stat_value(SAMPLE_POKEMON_A, "special_defence") == 85.0
    assert get_stat_value(SAMPLE_POKEMON_A, "speed") == 100.0
    assert get_stat_value(SAMPLE_POKEMON_A, "bst") == 534.0
    assert get_stat_value(SAMPLE_POKEMON_A, "height") == 1.7
    assert get_stat_value(SAMPLE_POKEMON_A, "weight") == 90.5


def test_compare_higher():
    """If B > A, result is higher."""
    # Blastoise HP (79) > Charizard HP (78)
    val_a = get_stat_value(SAMPLE_POKEMON_A, "hp")
    val_b = get_stat_value(SAMPLE_POKEMON_B, "hp")
    assert compare(val_a, val_b) == "higher"


def test_compare_lower():
    """If B < A, result is lower."""
    # Blastoise Attack (83) < Charizard Attack (84)
    val_a = get_stat_value(SAMPLE_POKEMON_A, "attack")
    val_b = get_stat_value(SAMPLE_POKEMON_B, "attack")
    assert compare(val_a, val_b) == "lower"


def test_compare_equal():
    """If B == A, result is equal."""
    assert compare(100.0, 100.0) == "equal"
    assert compare(0.0, 0.0) == "equal"


def test_build_pokemon_public_never_exposes_stats():
    """Ensure public representation does NOT include stat values."""
    pub = build_pokemon_public(SAMPLE_POKEMON_A)
    assert "stats" not in pub
    assert "bst" not in pub
    assert "height" not in pub
    assert "weight" not in pub
    assert "stat_value" not in pub
    assert pub["canonical_id"] == "charizard"
    assert pub["display_name"] == "Charizard"
    assert pub["artwork_url"] == "https://example.com/charizard.png"


def test_build_pokemon_with_stat_reveals_only_selected_stat():
    """Ensure build_pokemon_with_stat reveals only the requested stat."""
    with_stat = build_pokemon_with_stat(SAMPLE_POKEMON_A, "speed")
    assert with_stat["stat_category"] == "speed"
    assert with_stat["stat_value"] == 100.0
    assert "stats" not in with_stat  # full stats still not leaked
    assert with_stat["stat_label"] == "Speed"


def test_pick_random_pokemon_excludes():
    """Ensure exclude_ids prevents picking the same Pokemon."""
    pool = [SAMPLE_POKEMON_A, SAMPLE_POKEMON_B]
    for _ in range(20):
        picked = pick_random_pokemon(pool, exclude_ids={"charizard"})
        assert picked["canonical_id"] == "blastoise"
