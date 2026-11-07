"""Integration tests for the full STAXX API flow."""

import pytest


@pytest.mark.asyncio
async def test_health_endpoints(client):
    """Verify health and ready checks."""
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

    r = await client.get("/api/v1/ready")
    assert r.status_code == 200
    data = r.json()
    assert data["mongodb"] == "connected"
    assert data["redis"] == "connected"


@pytest.mark.asyncio
async def test_guest_auth_and_game_lifecycle(client):
    """Test full gameplay loop: guest signup -> start game -> hidden stat check -> guess -> results."""
    # 1. Create guest
    guest_res = await client.post("/api/v1/auth/guest", json={"display_name": "TestPlayer"})
    assert guest_res.status_code == 201
    guest_data = guest_res.json()
    assert guest_data["account_type"] == "guest"
    assert guest_data["display_name"] == "TestPlayer"
    token = guest_data.get("session_token")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # 2. Get current user
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["user_id"] == guest_data["user_id"]

    # 3. Start game
    start_res = await client.post("/api/v1/games/start", headers=headers)
    assert start_res.status_code == 201
    game_data = start_res.json()
    game_id = game_data["game_id"]
    assert game_data["round_number"] == 1
    assert "stat_category" in game_data

    # CRITICAL SECURITY CHECK: Pokemon B MUST NOT leak stat_value
    pokemon_b = game_data["pokemon_b"]
    assert "stat_value" not in pokemon_b
    assert "stats" not in pokemon_b
    assert "bst" not in pokemon_b

    # Pokemon A MUST have the revealed stat value
    pokemon_a = game_data["pokemon_a"]
    assert "stat_value" in pokemon_a

    # 4. Submit a guess
    guess_res = await client.post(
        f"/api/v1/games/{game_id}/guess",
        json={"answer": "higher"},
        headers=headers,
    )
    assert guess_res.status_code == 200
    guess_data = guess_res.json()
    assert "is_correct" in guess_data
    assert "correct_answer" in guess_data
    assert "pokemon_b_stat_value" in guess_data  # now revealed!

    if guess_data["is_correct"]:
        assert guess_data["streak"] == 1
        assert not guess_data["game_over"]
        assert "next_round" in guess_data
        # Verify next round also does not leak hidden pokemon B stat
        assert "stat_value" not in guess_data["next_round"]["pokemon_b"]
    else:
        assert guess_data["game_over"]


@pytest.mark.asyncio
async def test_leaderboards_endpoints(client):
    """Verify leaderboard retrieval."""
    r = await client.get("/api/v1/leaderboards/alltime")
    assert r.status_code == 200
    data = r.json()
    assert "entries" in data
    assert "period" in data
    assert data["period"] == "alltime"


@pytest.mark.asyncio
async def test_pokemon_endpoints(client):
    """Verify Pokémon search and count endpoints."""
    # Count
    r = await client.get("/api/v1/pokemon/count")
    assert r.status_code == 200
    assert r.json()["count"] > 0

    # Search
    r = await client.get("/api/v1/pokemon/search?q=char")
    assert r.status_code == 200
    assert "results" in r.json()


@pytest.mark.asyncio
async def test_google_auth_flow(client):
    """Verify Google authentication flow, session token issuance, and me endpoint."""
    google_res = await client.post(
        "/api/v1/auth/google",
        json={"id_token": "mock_google_token_ash"},
    )
    assert google_res.status_code == 200
    user_data = google_res.json()
    assert user_data["account_type"] == "google"
    assert "Trainer Ash" in user_data["display_name"]
    token = user_data["session_token"]
    assert token

    # Check authenticated session
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["user_id"] == user_data["user_id"]
    assert me_res.json()["account_type"] == "google"

    # Test claiming guest to Google
    guest = await client.post("/api/v1/auth/guest", json={"display_name": "TemporaryGuest"})
    assert guest.status_code == 201
    guest_token = guest.json()["session_token"]

    claim_res = await client.post(
        "/api/v1/auth/claim-guest",
        json={"id_token": "mock_google_token_brock"},
        headers={"Authorization": f"Bearer {guest_token}"},
    )
    assert claim_res.status_code == 200
    claimed_user = claim_res.json()
    assert claimed_user["account_type"] == "google"
    assert "Trainer Brock" in claimed_user["display_name"]


@pytest.mark.asyncio
async def test_guesser_independent_game_and_leaderboard(client):
    """Verify Ability/Guesser mini game has independent streak and leaderboard."""
    # 1. Create player
    guest_res = await client.post("/api/v1/auth/guest", json={"display_name": "GuesserPro"})
    assert guest_res.status_code == 201
    token = guest_res.json()["session_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Start ability game
    start_res = await client.post("/api/v1/games/abilities/start", headers=headers)
    assert start_res.status_code == 201
    game = start_res.json()
    assert game["mode"] == "abilities"
    assert "prompt" in game
    assert "options" in game
    assert len(game["options"]) == 4

    game_id = game["game_id"]
    chosen_id = game["options"][0]["canonical_id"]

    # 3. Submit guess
    guess_res = await client.post(
        f"/api/v1/games/abilities/{game_id}/guess",
        json={"pokemon_id": chosen_id},
        headers=headers,
    )
    assert guess_res.status_code == 200
    result = guess_res.json()
    assert "is_correct" in result
    assert "streak" in result

    # 4. Check guesser leaderboard
    lb_res = await client.get("/api/v1/leaderboards/alltime?mode=guesser")
    assert lb_res.status_code == 200
    assert lb_res.json()["mode"] == "guesser"
