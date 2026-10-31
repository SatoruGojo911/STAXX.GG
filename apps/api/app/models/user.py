"""Pydantic v2 models for users and guest accounts."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class UserDoc(BaseModel):
    """User document as stored in MongoDB."""

    id: str = Field(..., alias="_id", description="String representation of ObjectId or UUID")
    google_sub: str | None = None
    email: str | None = None
    display_name: str
    username: str | None = None
    avatar_url: str | None = None
    account_type: Literal["google", "guest"] = "guest"
    created_at: datetime
    updated_at: datetime

    model_config = {"populate_by_name": True}


class GuestAccount(BaseModel):
    """Guest account creation result."""

    user_id: str
    session_token: str
    display_name: str


class UserPublic(BaseModel):
    """Public-facing user information."""

    id: str
    display_name: str
    username: str | None = None
    avatar_url: str | None = None
    account_type: str


class UserProfileUpdate(BaseModel):
    """Fields a user can update on their own profile."""

    display_name: str | None = Field(None, min_length=1, max_length=32)
    username: str | None = Field(None, min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
