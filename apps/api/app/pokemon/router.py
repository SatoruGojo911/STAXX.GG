"""Pokémon router – /api/v1/pokemon endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from app.pokemon.service import (
    get_pokemon_by_id,
    get_pokemon_count,
    get_pokemon_forms,
    get_pokemon_stats,
    search_pokemon,
)

router = APIRouter(prefix="/pokemon", tags=["pokemon"])


@router.get("/search")
async def pokemon_search(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
):
    """Search Pokémon by name."""
    results = await search_pokemon(q, limit=limit)
    return {"results": results, "count": len(results)}


@router.get("/forms")
async def pokemon_forms(
    pokedex_number: int = Query(..., ge=1, description="National Pokédex number"),
):
    """List all forms for a Pokédex number."""
    forms = await get_pokemon_forms(pokedex_number)
    return {"forms": forms, "count": len(forms)}


@router.get("/stats")
async def pokemon_stats_endpoint(
    canonical_id: str = Query(..., min_length=1),
):
    """Get full stats for a Pokémon."""
    data = await get_pokemon_stats(canonical_id)
    if data is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pokémon not found.")
    return data


@router.get("/count")
async def pokemon_count():
    """Get total Pokémon count."""
    count = await get_pokemon_count()
    return {"count": count}


@router.get("/{canonical_id}")
async def pokemon_get(canonical_id: str):
    """Get a Pokémon by canonical ID."""
    data = await get_pokemon_by_id(canonical_id)
    if data is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pokémon not found.")
    return data
