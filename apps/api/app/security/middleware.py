"""Security middleware – request IDs, rate limiting, CSRF protection."""

from __future__ import annotations

import time
import uuid
import logging
from collections import defaultdict

from fastapi import FastAPI, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Attach a unique X-Request-ID header to every request/response."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory sliding-window rate limiter.

    Production deployments should use Redis-backed rate limiting; this provides
    a reasonable default for single-process development / staging.
    """

    def __init__(self, app: FastAPI, max_requests: int = 100, window_seconds: int = 60) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def _client_key(self, request: Request) -> str:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        client = request.client
        return client.host if client else "unknown"

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        key = self._client_key(request)
        now = time.time()
        cutoff = now - self.window_seconds

        # Prune old entries
        self._hits[key] = [t for t in self._hits[key] if t > cutoff]

        if len(self._hits[key]) >= self.max_requests:
            return Response(
                content='{"detail":"Rate limit exceeded. Try again later."}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json",
            )

        self._hits[key].append(now)
        return await call_next(request)


class CSRFMiddleware(BaseHTTPMiddleware):
    """Lightweight CSRF protection for state-changing requests.

    Requires an X-Requested-With header on POST/PUT/PATCH/DELETE.
    Browsers won't send custom headers on cross-origin simple requests,
    making this an effective CSRF guard when combined with SameSite cookies.
    """

    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method not in self.SAFE_METHODS:
            has_marker = (
                request.headers.get("X-Requested-With")
                or request.headers.get("Authorization")
                or request.headers.get("Content-Type", "").startswith("application/json")
            )
            if not has_marker:
                return Response(
                    content='{"detail":"CSRF validation failed – include X-Requested-With header or JSON content type."}',
                    status_code=status.HTTP_403_FORBIDDEN,
                    media_type="application/json",
                )
        return await call_next(request)
