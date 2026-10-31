# STAXX.GG — API Documentation

Base URL: `https://api.staxx.gg/api/v1` (production) | `http://localhost:8000/api/v1` (development)

## Authentication

### POST /auth/google
Authenticate with Google OAuth.

**Request:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "user": {
    "id": "usr_abc123",
    "username": "trainer_ash",
    "email": "ash@example.com",
    "avatar": "https://...",
    "best_streak": 42,
    "games_played": 150
  },
  "is_new": false
}
```

Sets HTTP-only session cookie.

### POST /auth/guest
Create a guest session.

**Response 200:**
```json
{
  "guest_id": "guest_xyz789",
  "session_token": "..."
}
```

### POST /auth/logout
End the current session.

### POST /auth/claim-guest
Migrate guest records to authenticated account.

**Request:**
```json
{
  "guest_session_token": "..."
}
```

### GET /auth/me
Get current authenticated user.

**Response 200:**
```json
{
  "user": { ... },
  "is_guest": false
}
```

---

## Games

### POST /games/start
Start a new game.

**Response 200:**
```json
{
  "game_id": "game_abc123",
  "round": {
    "round_number": 1,
    "stat_category": "attack",
    "stat_display": "Attack",
    "pokemon_a": {
      "canonical_id": "charizard",
      "display_name": "Charizard",
      "types": ["fire", "flying"],
      "artwork_url": "https://...",
      "stat_value": 84
    },
    "pokemon_b": {
      "canonical_id": "blastoise",
      "display_name": "Blastoise",
      "types": ["water"],
      "artwork_url": "https://..."
    }
  },
  "current_streak": 0,
  "personal_best": 42
}
```

Note: `pokemon_b.stat_value` is intentionally omitted.

### POST /games/{game_id}/guess
Submit a guess for the current round.

**Request:**
```json
{
  "answer": "higher"
}
```

`answer` must be one of: `"higher"`, `"lower"`, `"equal"`

**Response 200 (correct):**
```json
{
  "correct": true,
  "actual_value": 83,
  "correct_answer": "lower",
  "current_streak": 5,
  "personal_best": 42,
  "aura_level": 2,
  "aura_name": "Flame",
  "is_new_aura_tier": true,
  "next_round": {
    "round_number": 6,
    "stat_category": "speed",
    "stat_display": "Speed",
    "pokemon_a": { ... },
    "pokemon_b": { ... }
  }
}
```

**Response 200 (incorrect — game over):**
```json
{
  "correct": false,
  "actual_value": 83,
  "correct_answer": "lower",
  "current_streak": 5,
  "personal_best": 42,
  "is_new_personal_best": false,
  "game_over": true,
  "final_streak": 5,
  "next_round": null
}
```

### GET /games/{game_id}
Get game status.

### GET /games/{game_id}/result
Get completed game result.

### POST /games/{game_id}/abandon
Abandon an active game.

### GET /games/history
Get player's game history.

**Query params:** `page` (default 1), `per_page` (default 20)

---

## Players

### GET /players/me
Get current player profile.

### PATCH /players/me
Update player profile.

**Request:**
```json
{
  "username": "new_username"
}
```

### GET /players/me/stats
Get detailed player statistics.

### GET /players/{username}
Get public player profile.

---

## Leaderboards

### GET /leaderboards/alltime
All-time top streaks.

**Query params:** `page`, `per_page`

**Response 200:**
```json
{
  "entries": [
    {
      "rank": 1,
      "username": "pokemon_master",
      "avatar": "https://...",
      "best_streak": 127,
      "achieved_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1500,
  "page": 1,
  "per_page": 20,
  "current_player": {
    "rank": 42,
    "best_streak": 35
  }
}
```

### GET /leaderboards/daily
Today's best streaks.

### GET /leaderboards/weekly
This week's best streaks.

### GET /leaderboards/me
Current player's rankings across all leaderboards.

---

## Pokémon

### GET /pokemon/{canonical_id}
Get Pokémon details.

### GET /pokemon/search?q=charizard
Search Pokémon by name.

### GET /pokemon/forms
List all form categories with counts.

### GET /pokemon/stats
Get Pokémon stat distribution data.

---

## Health

### GET /health
Basic health check.

### GET /ready
Readiness check (includes DB connectivity).

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Game not found",
  "error_code": "GAME_NOT_FOUND",
  "request_id": "req_abc123"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request / validation error |
| 401 | Not authenticated |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (duplicate guess, etc.) |
| 429 | Rate limited |
| 500 | Internal server error |
