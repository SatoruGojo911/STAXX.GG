"""Pydantic v2 models for auth request / response schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class GoogleAuthRequest(BaseModel):
    """Body for POST /auth/google."""

    id_token: str = Field(..., min_length=1)


class GuestAuthRequest(BaseModel):
    """Body for POST /auth/guest (optional display name)."""

    display_name: str | None = Field(None, min_length=1, max_length=32)


class ClaimGuestRequest(BaseModel):
    """Body for POST /auth/claim-guest – link a guest account to Google."""

    id_token: str = Field(..., min_length=1)


class AuthResponse(BaseModel):
    """Unified auth response."""

    user_id: str
    display_name: str
    username: str | None = None
    avatar_url: str | None = None
    account_type: str
    is_new: bool = False
    session_token: str | None = None


class MeResponse(BaseModel):
    """Response for GET /auth/me."""

    user_id: str
    display_name: str
    username: str | None = None
    avatar_url: str | None = None
    account_type: str
    email: str | None = None
