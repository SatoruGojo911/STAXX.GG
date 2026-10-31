"""Auth router – /api/v1/auth endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status

from app.auth.dependencies import get_current_user
from app.auth.service import (
    claim_guest_account,
    create_guest_account,
    login_or_register_google,
    logout,
)
from app.config import settings
from app.models.auth import (
    AuthResponse,
    ClaimGuestRequest,
    GoogleAuthRequest,
    GuestAuthRequest,
    MeResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    """Set the session_token HTTP-only cookie."""
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.COOKIE_DOMAIN if settings.is_production else None,
        max_age=86400 * 7,  # 7 days
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    """Delete the session cookie."""
    response.delete_cookie(
        key="session_token",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.COOKIE_DOMAIN if settings.is_production else None,
        path="/",
    )


@router.post("/google", response_model=AuthResponse, status_code=status.HTTP_200_OK)
async def auth_google(body: GoogleAuthRequest, response: Response):
    """Authenticate via Google ID token."""
    try:
        user_data, session_token, is_new = await login_or_register_google(body.id_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    _set_session_cookie(response, session_token)
    return AuthResponse(
        user_id=user_data["user_id"],
        display_name=user_data["display_name"],
        username=user_data.get("username"),
        avatar_url=user_data.get("avatar_url"),
        account_type=user_data["account_type"],
        is_new=is_new,
        session_token=session_token,
    )


@router.post("/guest", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def auth_guest(response: Response, body: GuestAuthRequest | None = None):
    """Create a guest account."""
    display_name = body.display_name if body else None
    user_data, session_token = await create_guest_account(display_name)

    _set_session_cookie(response, session_token)
    return AuthResponse(
        user_id=user_data["user_id"],
        display_name=user_data["display_name"],
        username=user_data.get("username"),
        avatar_url=user_data.get("avatar_url"),
        account_type=user_data["account_type"],
        is_new=True,
        session_token=session_token,
    )


@router.post("/claim-guest", response_model=AuthResponse, status_code=status.HTTP_200_OK)
async def auth_claim_guest(
    body: ClaimGuestRequest,
    response: Response,
    current_user: dict = Depends(get_current_user),
):
    """Link the current guest session to a Google account."""
    if current_user.get("account_type") != "guest":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only guest accounts can be claimed.",
        )
    try:
        user_data, session_token, is_new = await claim_guest_account(
            current_user, body.id_token
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    _set_session_cookie(response, session_token)
    return AuthResponse(
        user_id=user_data["user_id"],
        display_name=user_data["display_name"],
        username=user_data.get("username"),
        avatar_url=user_data.get("avatar_url"),
        account_type=user_data["account_type"],
        is_new=is_new,
        session_token=session_token,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def auth_logout(
    response: Response,
    session_token: str | None = Cookie(None),
):
    """Destroy the current session."""
    if session_token:
        await logout(session_token)
    _clear_session_cookie(response)


@router.get("/me", response_model=MeResponse)
async def auth_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return MeResponse(
        user_id=current_user["user_id"],
        display_name=current_user["display_name"],
        username=current_user.get("username"),
        avatar_url=current_user.get("avatar_url"),
        account_type=current_user["account_type"],
        email=current_user.get("email"),
    )
