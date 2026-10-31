"""Auth dependencies for FastAPI – extract current user from cookie or Authorization header."""

from __future__ import annotations

from fastapi import Cookie, Header, HTTPException, status

from app.redis_client import get_session


def _extract_token(session_token: str | None, authorization: str | None) -> str | None:
    if session_token:
        return session_token
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
        return authorization
    return None


async def get_current_user(
    session_token: str | None = Cookie(None),
    authorization: str | None = Header(None),
) -> dict:
    """Require an authenticated user. Raises 401 if missing / invalid."""
    token = _extract_token(session_token, authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated – session token missing.",
        )
    session = await get_session(token)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid.",
        )
    return session


async def get_optional_user(
    session_token: str | None = Cookie(None),
    authorization: str | None = Header(None),
) -> dict | None:
    """Return the current user if present, else None (no error)."""
    token = _extract_token(session_token, authorization)
    if not token:
        return None
    return await get_session(token)
