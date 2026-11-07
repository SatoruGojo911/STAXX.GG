"""Games router – /api/v1/games endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import get_current_user
from app.games.service import (
    abandon_game,
    get_game,
    get_game_history,
    get_game_result,
    process_guess,
    start_game,
    start_ability_game,
    process_ability_guess,
)
from app.models.game import GuessRequest

router = APIRouter(prefix="/games", tags=["games"])


@router.post("/start", status_code=status.HTTP_201_CREATED)
async def games_start(current_user: dict = Depends(get_current_user)):
    """Start a new game session."""
    player_id = current_user["user_id"]
    try:
        result = await start_game(player_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return result


@router.post("/abilities/start", status_code=status.HTTP_201_CREATED)
async def abilities_start(current_user: dict = Depends(get_current_user)):
    try:
        return await start_ability_game(current_user["user_id"])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/abilities/{game_id}/guess")
async def abilities_guess(game_id: str, body: dict, current_user: dict = Depends(get_current_user)):
    pokemon_id = body.get("pokemon_id")
    if not isinstance(pokemon_id, str):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="pokemon_id is required")
    try:
        return await process_ability_guess(game_id, current_user["user_id"], pokemon_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))


@router.post("/{game_id}/guess")
async def games_guess(
    game_id: str,
    body: GuessRequest,
    current_user: dict = Depends(get_current_user),
):
    """Submit a guess for the current round."""
    player_id = current_user["user_id"]
    try:
        result = await process_guess(game_id, player_id, body.answer)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return result


@router.post("/{game_id}/abandon")
async def games_abandon(
    game_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Abandon an active game."""
    player_id = current_user["user_id"]
    try:
        result = await abandon_game(game_id, player_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return result


@router.get("/history", name="games_history")
async def games_history_list(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """Get game history for the current player."""
    player_id = current_user["user_id"]
    history = await get_game_history(player_id, limit=limit, skip=skip)
    return {"games": history, "count": len(history)}


@router.get("/{game_id}")
async def games_get(
    game_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get current game state (active) or summary (completed)."""
    player_id = current_user["user_id"]
    try:
        result = await get_game(game_id, player_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return result


@router.get("/{game_id}/result")
async def games_result(
    game_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get the full result of a completed game."""
    player_id = current_user["user_id"]
    try:
        result = await get_game_result(game_id, player_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return result
