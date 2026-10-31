# STAXX.GG

**Pokémon Higher or Lower — Full-Stack Game Platform**

> PLAY. GUESS. STAXX.

Compare Pokémon statistics and guess whether the next Pokémon has a higher, lower, or equal value. Build streaks, unlock evolving aura effects, and compete on global leaderboards.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Python 3.12+, FastAPI, Pydantic v2 |
| Database | MongoDB (permanent storage) |
| Cache | Redis (game state, leaderboards, sessions) |
| Auth | Google OAuth 2.0 / OpenID Connect |
| Typography | Redaction 35 |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+
- Docker & Docker Compose
- Google OAuth credentials (optional for dev)

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/staxx-gg.git
cd staxx-gg
cp .env.example .env
# Edit .env with your values
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

This starts MongoDB (port 27017) and Redis (port 6379).

### 3. Backend Setup

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Import Pokémon Data

```bash
cd scripts
pip install -r requirements.txt
python import_pokemon.py --mode full --concurrency 10
python validate_pokemon.py
```

### 5. Start Backend

```bash
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Frontend Setup

```bash
cd apps/web
npm install
npm run dev
```

### 7. Open in Browser

Visit [http://localhost:3000](http://localhost:3000)

### 8. Run Tests

```bash
# Backend tests
cd apps/api
pytest

# Frontend tests
cd apps/web
npm test
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API" and "Google Identity Services"
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000`
5. Copy the Client ID to `.env`:
   - `GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`

## Project Structure

```
staxx-gg/
├── apps/
│   ├── web/                # Next.js frontend
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   │   ├── game/       # Game board, controls, cards
│   │   │   ├── streak-aura/# Signature aura system
│   │   │   ├── leaderboard/# Rankings UI
│   │   │   ├── layout/     # Header, footer, theme
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities, API client, config
│   │   ├── types/          # TypeScript types
│   │   └── public/         # Static assets, fonts
│   │
│   └── api/                # FastAPI backend
│       ├── app/
│       │   ├── main.py     # App entry point
│       │   ├── config.py   # Settings
│       │   ├── database.py # MongoDB connection
│       │   ├── redis_client.py
│       │   ├── auth/       # Google OAuth, sessions
│       │   ├── games/      # Game engine, API
│       │   ├── players/    # Player profiles
│       │   ├── leaderboards/
│       │   ├── pokemon/    # Pokémon data API
│       │   └── security/   # Rate limiting, anti-cheat
│       └── tests/
│
├── scripts/
│   ├── import_pokemon.py   # PokéAPI data importer
│   ├── validate_pokemon.py # Data validation
│   ├── rebuild_leaderboards.py
│   └── seed_database.py
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
│
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml
```

## Game Features

- **9 stat categories**: HP, Attack, Defence, Sp. Atk, Sp. Def, Speed, BST, Height, Weight
- **All Pokémon forms**: Mega, Primal, Gmax, Alolan, Galarian, Hisuian, Paldean
- **Evolving Streak Aura**: 8 visual tiers from Spark to Godlike
- **Anti-cheat**: Server-side validation, no hidden stats in API responses
- **Leaderboards**: All-time, Daily, Weekly with Redis sorted sets
- **Dual themes**: Intentionally designed light and dark modes

## Deployment

See [docs/deployment.md](docs/deployment.md) for production deployment guide.

| Service | Provider |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Cache | Upstash Redis |
| Domain | staxx.gg |

## License

MIT
