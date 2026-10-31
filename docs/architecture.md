# STAXX.GG — Architecture

## System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Next.js App   │────▶│   FastAPI API     │────▶│  MongoDB    │
│   (Vercel)      │     │   (Render)        │     │  (Atlas)    │
│                 │     │                   │────▶│             │
│  - Game UI      │     │  - Game Engine    │     │  - Users    │
│  - Streak Aura  │     │  - Auth           │     │  - Pokemon  │
│  - Leaderboard  │     │  - Leaderboards   │     │  - Games    │
│  - Profiles     │     │  - Anti-cheat     │     │  - Stats    │
└─────────────────┘     └──────────────────┘     └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │   Redis     │
                        │   (Upstash) │
                        │             │
                        │  - Game     │
                        │    State    │
                        │  - Sessions │
                        │  - Leaders  │
                        │  - Rate     │
                        │    Limits   │
                        └─────────────┘
```

## Data Flow: Game Round

1. Player clicks "Play" → Frontend calls `POST /api/v1/games/start`
2. Backend selects 2 random Pokémon + 1 random stat category
3. Full round state saved to Redis (including hidden value)
4. Response returns: Pokémon A (with stat value), Pokémon B (name/art only), stat category
5. Player guesses Higher/Lower/Equal → `POST /api/v1/games/{id}/guess`
6. Backend reads hidden value from Redis (never from client)
7. Compares and determines correctness
8. If correct: increment streak, generate next round, return result + next round
9. If incorrect: end game, update MongoDB records, update leaderboards
10. Frontend animates result, updates streak aura

## Security Model

### Hidden Stat Protection
- Pokémon B's stat value is NEVER sent to the browser during active gameplay
- Values are stored server-side in Redis
- Only revealed after guess is submitted and validated
- Game state transitions are atomic (Redis Lua scripts)

### Anti-Cheat Measures
- Idempotent guess processing (replay-safe)
- Request ID validation
- Rate limiting per user
- Session verification on every request
- Game ownership verification
- Suspicious pattern detection (flagging, not auto-banning)

### Authentication
- Google OAuth 2.0 with server-side token verification
- HTTP-only, Secure, SameSite=Lax cookies
- Session rotation on privilege changes
- Guest accounts with migration path
- CSRF protection via SameSite cookies + origin verification

## MongoDB Collections

| Collection | Purpose | Key Indexes |
|------------|---------|-------------|
| `pokemon` | All Pokémon entries | canonical_id (unique), species_id, types, bst |
| `users` | Authenticated accounts | google_sub (unique), username (unique) |
| `guest_accounts` | Guest sessions | session_token (unique), expires_at (TTL) |
| `game_sessions` | Game records | player_id + started_at, status |
| `game_rounds` | Individual rounds | game_id + round_number |
| `player_stats` | Aggregated stats | user_id (unique), best_streak (desc) |
| `achievements` | Unlocked achievements | user_id + achievement_id |

## Redis Key Schema

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `game:{id}` | Hash | 1h | Active game state |
| `session:{id}` | Hash | 24h | User session |
| `leaderboard:alltime` | Sorted Set | None | All-time rankings |
| `leaderboard:daily:{date}` | Sorted Set | 48h | Daily rankings |
| `leaderboard:weekly:{week}` | Sorted Set | 8d | Weekly rankings |
| `ratelimit:{user_id}` | String | 60s | Rate limiting counter |
| `pokemon:random_pool` | List | 1h | Cached Pokémon ID pool |

## Aura Tier System

| Level | Name | Streak | Visual |
|-------|------|--------|--------|
| 0 | Normal | 0 | No aura |
| 1 | Spark | 1-4 | Soft glow, gentle pulse |
| 2 | Flame | 5-9 | Orange/red aura, particles |
| 3 | Supercharged | 10-19 | Electric blue/purple, waves |
| 4 | Radiant | 20-34 | Gold/purple layers |
| 5 | Ascended | 35-49 | Dragon purple, rotating ring |
| 6 | Legendary | 50-74 | Gold/cyan/violet, trails |
| 7 | Mythical | 75-99 | Multi-color evolving |
| 8 | Godlike | 100+ | Ultimate layered energy |
