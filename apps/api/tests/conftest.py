"""Pytest fixtures for STAXX.GG API tests."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app, lifespan


@pytest.fixture
async def client():
    """Async HTTP client for testing the FastAPI app within lifespan."""
    async with lifespan(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            yield c
