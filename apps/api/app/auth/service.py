"""Auth service – Google token verification, guest accounts, session management."""

from __future__ import annotations

import logging
import secrets
import uuid
from datetime import datetime, timezone

from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token as google_id_token

from app.config import settings
from app.database import get_db
from app.redis_client import delete_session, store_session

logger = logging.getLogger(__name__)


def _generate_session_token() -> str:
    """Generate a cryptographically secure session token."""
    return secrets.token_urlsafe(48)


async def verify_google_token(token: str) -> dict:
    """Verify a Google ID token and return the payload.

    Raises ValueError on invalid tokens.
    """
    # Allow mock tokens in non-production environments for testing and local development
    if not settings.is_production and (token.startswith("mock_google_") or token.startswith("dev_google_")):
        parts = token.split("_")
        name_part = parts[-1] if len(parts) > 2 else "trainer"
        return {
            "sub": f"mock_sub_{name_part}",
            "email": f"{name_part}@staxx.gg",
            "name": f"Trainer {name_part.capitalize()}",
            "picture": f"https://api.dicebear.com/7.x/bottts/svg?seed={name_part}",
        }

    try:
        audience = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
        idinfo = google_id_token.verify_oauth2_token(
            token,
            GoogleRequest(),
            audience,
        )
        return idinfo
    except Exception as exc:
        raise ValueError(f"Invalid Google token: {exc}") from exc


async def login_or_register_google(token: str) -> tuple[dict, str, bool]:
    """Authenticate via Google. Returns (user_dict, session_token, is_new)."""
    payload = await verify_google_token(token)
    google_sub = payload["sub"]
    email = payload.get("email")
    name = payload.get("name", email or "User")
    picture = payload.get("picture")

    db = get_db()
    now = datetime.now(timezone.utc)

    existing = await db.users.find_one({"google_sub": google_sub})
    is_new = existing is None

    if existing:
        # Update last-seen fields
        await db.users.update_one(
            {"_id": existing["_id"]},
            {"$set": {"updated_at": now, "avatar_url": picture}},
        )
        user_id = str(existing["_id"])
        display_name = existing.get("display_name", name)
        username = existing.get("username")
        avatar_url = picture
        account_type = "google"
    else:
        user_id = str(uuid.uuid4())
        user_doc = {
            "_id": user_id,
            "google_sub": google_sub,
            "email": email,
            "display_name": name,
            "avatar_url": picture,
            "account_type": "google",
            "created_at": now,
            "updated_at": now,
        }
        await db.users.insert_one(user_doc)
        display_name = name
        username = None
        avatar_url = picture
        account_type = "google"

        # Ensure player_stats exists
        await db.player_stats.update_one(
            {"user_id": user_id},
            {"$setOnInsert": {
                "user_id": user_id,
                "games_played": 0,
                "total_correct": 0,
                "total_incorrect": 0,
                "best_streak": 0,
                "current_streak": 0,
                "average_streak": 0.0,
                "last_played": None,
            }},
            upsert=True,
        )

    session_token = _generate_session_token()
    session_data = {
        "user_id": user_id,
        "display_name": display_name,
        "username": username,
        "avatar_url": avatar_url,
        "account_type": account_type,
        "email": email,
    }
    await store_session(session_token, session_data)

    return session_data, session_token, is_new


async def create_guest_account(display_name: str | None = None) -> tuple[dict, str]:
    """Create a guest account. Returns (user_dict, session_token)."""
    db = get_db()
    now = datetime.now(timezone.utc)
    user_id = str(uuid.uuid4())
    guest_name = display_name or f"Guest_{secrets.token_hex(4)}"

    user_doc = {
        "_id": user_id,
        "display_name": guest_name,
        "account_type": "guest",
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(user_doc)

    # Ensure player_stats exists
    await db.player_stats.update_one(
        {"user_id": user_id},
        {"$setOnInsert": {
            "user_id": user_id,
            "games_played": 0,
            "total_correct": 0,
            "total_incorrect": 0,
            "best_streak": 0,
            "current_streak": 0,
            "average_streak": 0.0,
            "last_played": None,
        }},
        upsert=True,
    )

    session_token = _generate_session_token()
    session_data = {
        "user_id": user_id,
        "display_name": guest_name,
        "username": None,
        "avatar_url": None,
        "account_type": "guest",
        "email": None,
    }
    await store_session(session_token, session_data)

    return session_data, session_token


async def claim_guest_account(guest_session: dict, google_token: str) -> tuple[dict, str, bool]:
    """Link a guest account to a Google account.

    Returns (user_dict, new_session_token, is_new).
    """
    payload = await verify_google_token(google_token)
    google_sub = payload["sub"]
    email = payload.get("email")
    name = payload.get("name", email or "User")
    picture = payload.get("picture")

    db = get_db()
    now = datetime.now(timezone.utc)
    guest_user_id = guest_session["user_id"]

    # Check if this Google account already exists
    existing_google = await db.users.find_one({"google_sub": google_sub})
    if existing_google:
        # Merge: keep the Google account, transfer guest stats if better
        google_user_id = str(existing_google["_id"])
        # TODO: merge stats if needed – for now just log in as the Google user
        session_token = _generate_session_token()
        session_data = {
            "user_id": google_user_id,
            "display_name": existing_google.get("display_name", name),
            "username": existing_google.get("username"),
            "avatar_url": picture,
            "account_type": "google",
            "email": email,
        }
        await store_session(session_token, session_data)
        return session_data, session_token, False

    # Upgrade guest → Google
    await db.users.update_one(
        {"_id": guest_user_id},
        {"$set": {
            "google_sub": google_sub,
            "email": email,
            "display_name": name,
            "avatar_url": picture,
            "account_type": "google",
            "updated_at": now,
        }},
    )

    session_token = _generate_session_token()
    session_data = {
        "user_id": guest_user_id,
        "display_name": name,
        "username": guest_session.get("username"),
        "avatar_url": picture,
        "account_type": "google",
        "email": email,
    }
    await store_session(session_token, session_data)
    return session_data, session_token, False


async def logout(session_token: str) -> None:
    """Destroy a session."""
    await delete_session(session_token)
